var config = {
    mostUpdatedCode: "0",
    lastUpdateMonth: "May",
    lastUpdateYear: "2017",
    lastDataURL:'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1PZuC-Kf206kUcizDhz9qtWPR7hvc9hlfDJwirNbaPbk%2Fedit%23gid%3D1685091410',
    whoFieldName: "#org",
    whatFieldName: "#sector",
    whereFieldName: "#adm2+code",
    sumField: "#beneficiary",
    geo: "data/Somalia_District_Polygon.json",
    joinAttribute: "DIS_CODE",
    nameAttribute: "DIST_NAME",
    color: "#3B88C0",
    mechanismField: "#indicator+mechanism",
    conditonalityField: "#indicator+conditionality",
    restrictionField: "#indicator+restriction",
    ruralField: "#loc+type",
    transferValue: "#value+total"
};

var globalMonthlyData = {},
    cashData,
    geom,
    settings = {};

var monthlyMonths = ['x'],
    monthlyBeneficiaries = ['Beneficiaries'],
    monthlyTransfer = ['Transfer value'];

function updateSelectionMonthYear (mm, yy) {

} // end of updateSelectionMonthYear

var initSettings = (function(){
    $.ajax({
        type: 'GET',
        //test
         url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1PZuC-Kf206kUcizDhz9qtWPR7hvc9hlfDJwirNbaPbk%2Fedit%23gid%3D575563760&force=on',
        //production
//       url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1PZuC-Kf206kUcizDhz9qtWPR7hvc9hlfDJwirNbaPbk%2Fedit%23gid%3D0&force=on',
        format: 'json',
        async: false,
        success: function(args){
            var dataSettings = hxlProxyToJSON(args);
            dataSettings.forEach( function(element) {
                settings[element['#meta+code']] = {'month':element['#date+month+name'],'year':element['#date+year'],'value':element['#value'],'beneficiaries':element['#beneficiary'],'link':element['#meta+link']};
                monthlyMonths.push(element['#date+month']);
                monthlyBeneficiaries.push(element['#beneficiary']);
                monthlyTransfer.push(element['#value']);
                //globalMonthlyData[element['#meta+code']] = {'date':element['#month'],'link':element['#meta+link']};
            });
        },
        complete: function(){
            initConfig();
            initCashData(config.lastDataURL);
        }
    })

})();

// console.log(monthlyMonths)
// console.log(monthlyBeneficiaries)
// console.log(monthlyTransfer)


function initConfig() {
    var bigger = 1;

    for (key in settings){
        var current = parseFloat(key);
        current >= bigger ?  bigger = current : '';
    } 
    if (bigger =='undefined') {
        config.mostUpdatedCode = 201710 ;
        config.lastDataURL = 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1PZuC-Kf206kUcizDhz9qtWPR7hvc9hlfDJwirNbaPbk%2Fedit%23gid%3D1685091410' ;
    } else {
        config.mostUpdatedCode = bigger ;
        config.lastDataURL = settings[bigger].link ;
        config.lastUpdateMonth = settings[bigger].month ;
        config.lastUpdateYear = settings[bigger].year ;
    }
    
} //end of initConfig

function initCashData(dataLink) {
    var dataCash = (function(){
    var a;
    $.ajax({
        type: 'GET',
        url: dataLink,
        format: 'json',
        async: false,
        success: function(dataArgs){
            a = hxlProxyToJSON(dataArgs);
        }
    });
    return a;
    })();
    cashData = crossfilter (dataCash); 

} //end of initCashData

$('.monthSelectionList option').filter(function(){
    return $(this).text() == config.lastUpdateMonth;
}).prop('selected', true);

$('.yearSelectionList option').filter(function(){
    return $(this).text() == config.lastUpdateYear;
}).prop('selected', true);

function hxlProxyToJSON(input, headers) {
    var output = [];
    var keys = []
    input.forEach(function (e, i) {
        if (i == 0) {
            e.forEach(function (e2, i2) {
                var parts = e2.split('+');
                var key = parts[0]
                if (parts.length > 1) {
                    var atts = parts.splice(1, parts.length);
                    atts.sort();
                    atts.forEach(function (att) {
                        key += '+' + att
                    });
                }
                keys.push(key);
            });
        } else {
            var row = {};
            e.forEach(function (e2, i2) {
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

function print_filter(filter) {
    var f = eval(filter);
    if (typeof (f.length) != "undefined") {} else {}
    if (typeof (f.top) != "undefined") {
        f = f.top(Infinity);
    } else {}
    if (typeof (f.dimension) != "undefined") {
        f = f.dimension(function (d) {
            return "";
        }).top(Infinity);
    } else {}
    console.log(filter + "(" + f.length + ") = " + JSON.stringify(f).replace("[", "[\n\t").replace(/}\,/g, "},\n\t").replace("]", "\n]"));
}

var formatComma = d3.format(',');
var formatDecimalComma = d3.format(",.0f");

var formatDecimal = function (d) {
    ret = d3.format(".3f");
    return "$ " + ret(d);
};
var formatDecimalAVG = function (d) {
    ret = d3.format(".1f");
    return "$ " + ret(d);
};
var formatMoney = function (d) {
    return "$ " + formatDecimalComma(d);
};

function checkIntData(d){
    return (isNaN(parseInt(d)) || parseInt(d)<0) ? 0 : parseInt(d);
};

function generate3WComponent() {
    var lookup = genLookup();

    // cashData.forEach( function(element) {
    //     element['#value'] = checkIntData(element['#value']);
    //     element['#beneficiary'] = checkIntData(element['#beneficiary']);
    // });

    var whoChart = dc.rowChart('#hdx-3W-who');
    var whatChart = dc.rowChart('#hdx-3W-what');
    var whereChart = dc.leafletChoroplethChart('#hdx-3W-where');

    var whoRegional = dc.rowChart('#regionalCash');

    var filterMechanismPie = dc.pieChart('#filterMechanism');
    var filtercondPie = dc.pieChart('#filterConditionality');
    var filterRestPie = dc.pieChart('#filterRestriction');
    var filterRuralUrban = dc.pieChart('#filterArea');
    var numOfPartners = dc.numberDisplay('#numberOfOrgs');
    var amountTransfered = dc.numberDisplay('#amountTransfered');
    var peopleAssisted = dc.numberDisplay('#peopleAssisted');

    // var cashData = crossfilter(data);


    var whoRegionalDim = cashData.dimension(function (d) {
        return d["#adm1+name"];
    });

    var whoDimension = cashData.dimension(function (d) {
        return d[config.whoFieldName];
    });

    var whatDimension = cashData.dimension(function (d) {
        return d[config.whatFieldName];
    });
    var whereDimension = cashData.dimension(function (d) {
        return d[config.whereFieldName];
    });

    var dimMecha = cashData.dimension(function (d) {
        return d[config.mechanismField];
    });
    var dimCond = cashData.dimension(function (d) {
        return d[config.conditonalityField];
    });
    var dimRest = cashData.dimension(function (d) {
        return d[config.restrictionField];
    });
    var dimRuralUrban = cashData.dimension(function (d) {
        return d[config.ruralField];
    });

    var whoRegionalGroup = whoRegionalDim.group().reduceSum(function (d) {
        return d[config.sumField]
    });

    var groupMecha = dimMecha.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });

    var groupCond = dimCond.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });

    var groupRest = dimRest.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });

    var groupRuralUrban = dimRuralUrban.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });


    var whoGroup = whoDimension.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });

    var whatGroup = whatDimension.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });

    var whereGroup = whereDimension.group().reduceSum(function (d) {
        return parseInt(d[config.sumField]);
    });

    var all = cashData.groupAll();

    var gp = cashData.groupAll().reduce(
        function (p, v) {
            p.peopleAssisted += +v[config.sumField];
            p.amountTransfered += +v[config.transferValue];
            if (v[config.whoFieldName] in p.orgas)
                p.orgas[v[config.whoFieldName]]++;
            else {
                p.orgas[v[config.whoFieldName]] = 1;
                p.numOrgs++;
            }

            return p;
        },
        function (p, v) {
            p.peopleAssisted -= +v[config.sumField];
            p.amountTransfered -= +v[config.transferValue];
            
            p.orgas[v[config.whoFieldName]]--;
            if (p.orgas[v[config.whoFieldName]] == 0) {
                delete p.orgas[v[config.whoFieldName]];
                p.numOrgs--;
            }

            if (p.peopleAssisted < 0) p.peopleAssisted = 0;
            if (p.amountTransfered < 0) p.amountTransfered = 0;

            return p;
        },
        function () {
            return {
                peopleAssisted: 0,
                amountTransfered: 0,
                numOrgs: 0,
                orgas: []
            };

        }
    );
    var numO = function (d) {
        return d.numOrgs;
    };

    var amount = function(d){
        return d.amountTransfered;
    }

    var peopleA = function(d){
        return d.peopleAssisted;
    }

    numOfPartners.group(gp)
        .valueAccessor(numO)
        .formatNumber(formatDecimalComma);

    amountTransfered.group(gp)
        .valueAccessor(amount)
        .formatNumber(formatMoney);

    peopleAssisted.group(gp)
        .valueAccessor(peopleA)
        .formatNumber(formatDecimalComma);

    //tooltip
    var rowtip = d3.tip().attr('class', 'd3-tip').html(function (d) {
        return d.key + ': ' + d3.format('0,000')(d.value);

    });

    //tooltip
    var slicetip = d3.tip().attr('class', 'd3-tip').html(function (d) {
        return d.data.key + ': ' + d3.format('0,000')(d.value);
    });

    var colorScale = d3.scale.ordinal().range(['#DDDDDD', '#A7C1D3', '#71A5CA', '#73A9D9', '#8CBCD2', '#3B88C0', '#056CB6']);


    filterMechanismPie.width(190)
        .height(190)
        .radius(80)
        .innerRadius(40)
        .dimension(dimMecha)
        .group(groupMecha)
        .colors(colorScale)
        .title(function (d) {
            return;
        }).on('renderlet', function (chart) {
            chart.selectAll('text.pie-slice')
                .attr('transform', function (d) {
                    var translate = d3.select(this).attr('transform');
                    var ang = ((d.startAngle + d.endAngle) / 2 * 180 / Math.PI) % 360;
                    return translate + ' rotate(' + ang + ')';
                });
        });


    var colorScale3 = d3.scale.ordinal().range(['#DDDDDD', '#A7C1D3', '#71A5CA', '#3B88C0']);

    filtercondPie.width(190)
        .height(190)
        .radius(80)
        .innerRadius(40)

        .dimension(dimCond)
        .group(groupCond)
        .colors(colorScale3)
        .title(function (d) {
            return;
        }).on('renderlet', function (chart) {
            chart.selectAll('text.pie-slice')
                .attr('transform', function (d) {
                    var translate = d3.select(this).attr('transform');
                    var ang = ((d.startAngle + d.endAngle) / 2 * 180 / Math.PI) % 360;
                    if (ang < 180) ang -= 90;
                    else ang += 90;
                    return translate + ' rotate(' + ang + ')';
                });
        });

    filterRestPie.width(190)
        .height(190)
        .radius(80)
        .innerRadius(40)

        .dimension(dimRest)
        .group(groupRest)
        .title(function (d) {
            return;
        });


    filterRuralUrban.width(190)
        .height(190)
        .radius(80)
        .innerRadius(40)

        .dimension(dimRuralUrban)
        .group(groupRuralUrban)
        .colors(colorScale3)
        .title(function (d) {
            return;
        });

    whoChart.width($('#hxd-3W-who').width()).height(400)
        .dimension(whoDimension)
        .group(whoGroup)
        .elasticX(true)
        .data(function (group) {
            return group.top(15);
        })
        .labelOffsetY(13)
        .colors([config.color])
        .colorAccessor(function (d, i) {
            return 0;
        })
        .xAxis().ticks(5);

    whatChart.width($('#hxd-3W-what').width()).height(350)
        .dimension(whatDimension)
        .group(whatGroup)
        .elasticX(true)
        .data(function (group) {
            return group.top(15);
        })
        .labelOffsetY(31)
        .colors([config.color])
        .colorAccessor(function (d) {
            return 0;
        })
        .xAxis().ticks(5);


    whoRegional.width(585).height(450)
        .dimension(whoRegionalDim)
        .group(whoRegionalGroup)
        .elasticX(true)
        .data(function (group) {
            return group.top(17);
        })
        .labelOffsetY(13)
        .colors([config.color])
        .colorAccessor(function (d) {
            return 0;
        })
        .xAxis().ticks(5);

    dc.dataCount('#count-info')
        .dimension(cashData)
        .group(all);
    
    whereChart.width($('#hxd-3W-where').width()).height(400)
        .dimension(whereDimension)
        .group(whereGroup)
        .center([0, 0])
        .zoom(0)
        .geojson(geom)
        .colors(['#DDDDDD', '#A7C1D3', '#71A5CA', '#3B88C0', '#056CB6'])
        .colorDomain([0, 4])
        .colorAccessor(function (d) {
            var c = 0
            if (d > 150000) {
                c = 4;
            } else if (d > 50000) {
                c = 3;
            } else if (d > 1000) {
                c = 2;
            } else if (d > 0) {
                c = 1;
            };
            return c
        })
        .featureKeyAccessor(function (feature) {
            return feature.properties['DIS_CODE'];

        }).popup(function (feature) {
            text = lookup[feature.key] + "<br/>No. Beneficiaries : " + formatComma(feature.value);

            return text;
        })
        .renderPopup(true);

    $('.monthly-viz-container').show();
    $('.loader').hide();
    dc.renderAll();

    d3.selectAll('g.row').call(rowtip);
    d3.selectAll('g.row').on('mouseover', rowtip.show).on('mouseout', rowtip.hide);

    d3.selectAll('g.pie-slice').call(slicetip);
    d3.selectAll('g.pie-slice').on('mouseover', slicetip.show).on('mouseout', slicetip.hide);

    var map = whereChart.map();
    zoomToGeom(geom);
    map.options.minZoom = 5;
    map.options.maxZoom = 7;
    function zoomToGeom(geom) {
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([
            [bounds[0][1], bounds[0][0]],
            [bounds[1][1], bounds[1][0]]
        ]);
    }

    function genLookup() {
        var lookup = {};
        geom.features.forEach(function (e) {
            lookup[e.properties['DIS_CODE']] = String(e.properties['DIST_NAME']);
        });
        return lookup;
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    } 

}// gin generate3WComponent

function generateLineCharts(x, data1, data2, bindTo){
   c3.generate({
        bindto: bindTo,
        size: {
            height: 200
        },
        data: {
            x: 'x',
            columns: [
            x,
            data1,
            data2
            ]
        },
        axis: {
            x: {
                type: 'timeseries',
                //localtime: false,
                tick: {
                    //count:6,
                    format: '%b %Y'
                }
            },
            y: {
                tick: {
                    count:6,
                    format: d3.format('.2s')
                }
            }
        },
        tooltip: {
            format: {
                value: d3.format(',')
            }
        }

    });

} //fin generateLineCharts

var datesDic = {
        'January':'01',
        'February':'02',
        'March':'03',
        'April':'04',
        'May':'05',
        'June':'06',
        'July':'07',
        'August':'08',
        'September':'09',
        'October':'10',
        'November':'11',
        'December':'12'
};

function generateKeyFigures (mm, yy) {
    var id = String(yy)+datesDic[mm];
    $("#peopleAssisted").text(formatComma(parseFloat(settings[id].beneficiaries)));
    $("#amountTransfered").text(formatMoney(parseFloat(settings[id].value)));
    
} //fin generateKeyFigures


$('#update').on('click', function(){
    var month = $('.monthSelectionList').val();
    var year = $('.yearSelectionList').val();
    var id = String(year)+datesDic[month];
    if (settings[id] !== undefined) {
        $('.monthly-viz-container').hide();
        $('.loader').show();
        // generateKeyFigures(month, year);
        initCashData(settings[id].link);
        generate3WComponent();
    }else{
        $('#myModal').modal('show');
    }

})

var monthlyCall = $.ajax({
    type: 'GET',
    url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1PZuC-Kf206kUcizDhz9qtWPR7hvc9hlfDJwirNbaPbk%2Fedit%23gid%3D1868352423&force=on',
    dataType: 'json'
})

var geomCall = $.ajax({
    type: 'GET',
    url: 'data/Somalia_District_Polygon.json',
    dataType: 'json',
});

$.when(geomCall).then(function (geomArgs) {
    geom = geomArgs;
    generateLineCharts(monthlyMonths,monthlyBeneficiaries, monthlyTransfer, '#yearlyChart');
    // generateKeyFigures(config.lastUpdateMonth, config.lastUpdateYear);
    generate3WComponent();
});

// fin