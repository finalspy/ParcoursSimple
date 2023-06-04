// ==UserScript==
// @name         ParcourSimple
// @namespace    https://ypetit.net/
// @version      0.4
// @description  Simplification de l'affichage des voeux en attente sur ParcourSup!
// @author       ypetit
// @match        https://dossierappel.parcoursup.fr/Candidat/admissions?ACTION=0
// @icon         https://www.google.com/s2/favicons?sz=64&domain=parcoursup.fr
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle ( `
        #psimple{
            position:absolute;
            top:0;
            left:0;
            display:block;
            z-index: 99999;
            height: 40px;
            padding: 10px;
            background-color: var(--background-active-blue-france);
            color: #FFF;
        }
        #psimple img{
            margin: 0 10px;
        }
        #parcoursimple {
            position:fixed;
            z-index: 9999;
            top:40px;
            left:10px;
            max-height: 98%;
            overflow-y: auto;
            background-color: whitesmoke;
            margin: 10px;
            border: dotted dimgray 0.5px;
            box-shadow: 10px 8px 5px gray;
        }
        #parcoursimple table{
            border-collapse: collapse;
            vertical-align: middle;
            background-color: #FFF;
        }
        #parcoursimple thead{
            position: sticky;
            top: 0px;
        }
        #parcoursimple th{
            color: #FFF;
            background-color: var(--background-active-blue-france);
            font-weight: bold;
        }
        #parcoursimple th, #parcoursimple td{
            border: 1px solid black;
            padding: 4px;
        }
        #parcoursimple .right{
            text-align: right;
        }
        #parcoursimple .bold{
            font-weight: bold;
        }
        #parcoursimple .light{
            color: lightgrey;
        }
        #parcoursimple .ok{
            background-color: lightgreen;
        }
        #parcoursimple .ko{
            background-color: lightpink;
        }
        /* add other CSS here */
    ` );

    let show = true;
    document.addEventListener('keyup', function(e){
        // if click on a
        if(65 == e.which){
            const x = document.getElementById('parcoursimple');
            x.style.display = (x.style.display === "none")?"block":"none";
        }
    });

    $("body").prepend('<div id="psimple"><img src="/favicon.ico">Touche "a" affiche/cache le tableau</div>');
    $("body").append(
        '<div id="parcoursimple" name="parcoursimple">' +
        '<table id="parcoursimple_table">'+
        '<thead><tr><th>Ecole</th><th>Cursus</th><th>Places</th><th>Dernier</th><th>2022</th><th>Classement</th><th>Liste Attente</th><th>Total Attente</th></tr></thead>' +
        '<tbody id="parcoursimple_table_body"></tbody></table></div>'
    );

    // get all wishes
    const cards = Array.from(document.querySelectorAll(".psup-wish-card--info"));
    const wishes = [];
    class Wish {
        constructor(school, course, id, waiting_position, waiting_total, places, ranking, last, lastLastYear){
            this.school=school;
            this.course=course;
            this.id=id;
            this.waiting_position=Number(waiting_position);
            this.waiting_total=Number(waiting_total);
            this.places=Number(places);
            this.ranking=Number(ranking);
            this.last=Number(last);
            this.lastLastYear=Number(lastLastYear);
        }
        show(){
            return "<tr>"
                + "<td>"+ this.school + "</td>"
                + "<td>" + this.course + "</td>"
                + "<td class='right'>" + this.places + "</td>"
                + "<td class='right'>" + this.last + "</td>"
                + "<td class='right'>" + this.lastLastYear + "</td>"
                + "<td class='right " + this.rankColor() + "'>" + this.ranking + "</td>"
                + "<td class='right bold'>" + this.waiting_position + "</td>"
                + "<td class='right light'>" + this.waiting_total + "</td>"
                + "</tr>";
        }
        rankColor(){
            return this.lastLastYear > this.ranking ? "ok" : "ko";
        }
    }
    const promises = [];
    cards.forEach(card => {
        const onclick = card.querySelectorAll('button')[0].getAttribute('onclick');
        const id = onclick.substring(onclick.indexOf("&") + 1, onclick.lastIndexOf("'"));
        const school = card.querySelectorAll('.psup-wish-card__school')[0].innerHTML;
        const course= card.querySelectorAll('.psup-wish-card__course')[0].innerHTML;
        //https://dossierappel.parcoursup.fr/Candidat/
        const URL = "admissions?ACTION=2&" +id + "&frOpened=false&frJsModalButton=true";
        promises.push($.ajax({
            url: URL,
            type: "GET",
            dataType: "html",
            success: function (h) {
                const template = document.createElement('div');
                template.innerHTML = h.trim();
                const waiting_position = template.querySelector("div ul li:nth-child(1) b").innerHTML;
                const waiting_total = template.querySelector("div ul li:nth-child(2) b").innerHTML;
                // --------------
                const places = template.querySelector(".fr-alert ul li:nth-child(1) b").innerHTML;
                const ranking = template.querySelector(".fr-alert ul li:nth-child(2) p b").innerHTML;
                const last = template.querySelector(".fr-alert ul li:nth-child(3) b").innerHTML;
                const lastYear = template.querySelector(".fr-alert ul li:nth-child(4) b");
                const lastLastYear = (lastYear)?lastYear.innerHTML:"?";
                wishes.push(new Wish(school,
                    course,
                    id,
                    waiting_position,
                    waiting_total,
                    places,
                    ranking,
                    last,
                    lastLastYear
                ));
            },
            error: function (h) { console.err(h); },
            complete: function () {}
        }));
    });
    $.when.apply($, promises).then(function() {
        wishes.sort((a,b) => a.waiting_position - b.waiting_position);
        let r = document.getElementById("parcoursimple_table_body");
        for(let w in wishes){
            r.innerHTML += wishes[w].show().trim();
        }
    });
})();
