var config = {
    lastUpdateMonth: "May",
    lastUpdateYear: "2017",
    lastDataURL: "https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1PZuC-Kf206kUcizDhz9qtWPR7hvc9hlfDJwirNbaPbk%2Fedit%23gid%3D251024910",
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
    transferValue: "#beneficiary",
    estimatedField: "#indicator+amount+total"
};

$('.monthSelectionList option').filter(function(){
    return $(this).text()== config.lastUpdateMonth;
}).prop('selected', true);

$('.yearSelectionList option').filter(function(){
    return $(this).text()== config.lastUpdateYear;
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

var monthlyMonths = ['x'],
    monthlyBeneficiaries = ['Beneficiaries trends'],
    monthlyTransfer = ['Transfer value trends'];

function checkIntData(d){
    return (isNaN(parseInt(d)) || parseInt(d)<0) ? 0 : parseInt(d);
};

function generate3WComponent(data, geom) {

    var lookup = genLookup(geom, config);

    var whoChart = dc.rowChart('#hdx-3W-who');
    var whatChart = dc.rowChart('#hdx-3W-what');
    var whereChart = dc.leafletChoroplethChart('#hdx-3W-where');

    var whoRegional = dc.rowChart('#regionalCash');

    var filterMechanismPie = dc.pieChart('#filterMechanism');
    var filtercondPie = dc.pieChart('#filterConditionality');
    var filterRestPie = dc.pieChart('#filterRestriction');
    var filterRuralUrban = dc.pieChart('#filterArea');

    var cf = crossfilter(data);

    data.forEach( function(element) {
        element['#value'] = checkIntData(element['#value']);
        element['#beneficiary'] = checkIntData(element['#beneficiary']);
    });

    var whoRegionalDim = cf.dimension(function (d) {
        return d["#adm1+name"];
    });

    var whoDimension = cf.dimension(function (d) {
        return d[config.whoFieldName];
    });

    var whatDimension = cf.dimension(function (d) {
        return d[config.whatFieldName];
    });
    var whereDimension = cf.dimension(function (d) {
        return d[config.whereFieldName];
    });

    var dimMecha = cf.dimension(function (d) {
        return d[config.mechanismField];
    });
    var dimCond = cf.dimension(function (d) {
        return d[config.conditonalityField];
    });
    var dimRest = cf.dimension(function (d) {
        return d[config.restrictionField];
    });
    var dimRuralUrban = cf.dimension(function (d) {
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

    var all = cf.groupAll();
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
        //.colors(colorScale3)
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
        .dimension(cf)
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
            return feature.properties[config.joinAttribute];
        }).popup(function (d) {
            text = lookup[d.key] + "<br/>No. Beneficiaries : " + formatComma(d.value);
            return text;
        })
        .renderPopup(true);

    $('.monthly-viz-container').show();
    $('.loader').hide()
    dc.renderAll();

    d3.selectAll('g.row').call(rowtip);
    d3.selectAll('g.row').on('mouseover', rowtip.show).on('mouseout', rowtip.hide);

    d3.selectAll('g.pie-slice').call(slicetip);
    d3.selectAll('g.pie-slice').on('mouseover', slicetip.show).on('mouseout', slicetip.hide);

    var map = whereChart.map();
    zoomToGeom(geom);

    function zoomToGeom(geom) {
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([
            [bounds[0][1], bounds[0][0]],
            [bounds[1][1], bounds[1][0]]
        ]);
    }

    function genLookup(geojson, config) {
        var lookup = {};
        geojson.features.forEach(function (e) {
            lookup[e.properties[config.joinAttribute]] = String(e.properties[config.nameAttribute]);
        });
        return lookup;
    }

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    } 

}// gin generate3WComponent

function generateLineCharts(data, bindTo){
   c3.generate({
        bindto: bindTo,
        size: {
            height: 200
        },
        data: {
            x: 'x',
            columns: data //[monthlyMonths, monthlyBeneficiaries, monthlyTransfer]
        },
        axis: {
            x: {
                type: 'timeseries',
                localtime: false,
                tick: {
                    count:6,
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
        'January':'1',
        'February':'2',
        'March':'3',
        'April':'4',
        'May':'5',
        'June':'6',
        'July':'7',
        'August':'8',
        'September':'9',
        'October':'10',
        'November':'11',
        'December':'12'
};

function generateKeyFigures (mm, yy) {
    var id = String(yy)+datesDic[mm];
    $("#peopleAssisted").text(formatComma(parseFloat(globalMonthlyData[id].beneficiaries)));
    $("#amountTransfered").text(formatMoney(parseFloat(globalMonthlyData[id].value)));
    
} //fin generateKeyFigures

$('.monthSelectionList').on('change', function(e){
    var month = $('.monthSelectionList').val();
    var year = $('.yearSelectionList').val();
    generateKeyFigures(month, year);

    var id = String(year)+datesDic[month];
    updateMonthlyData(globalMonthlyData[id].link);

});
// since we have 2018 data

// $('.yearSelectionList').on('change', function(e){
//     var month = $('.monthSelectionList').val();
//     var year = $('.yearSelectionList').val();
//     generateKeyFigures(month, year);

//     var id = String(year)+datesDic[month];
//     updateMonthlyData(globalMonthlyData[id].link);

// });

var monthlyCall = $.ajax({
    type: 'GET',
    url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1PZuC-Kf206kUcizDhz9qtWPR7hvc9hlfDJwirNbaPbk%2Fedit%23gid%3D1868352423',
    dataType: 'json'
})

// donnees de la feuille excel monthly_data
var globalMonthlyData = {};

$.when(monthlyCall).then(function(monthlyArgs){


    var monthlyData = hxlProxyToJSON(monthlyArgs);
    monthlyData.forEach(function (element) {
        monthlyMonths.push(element['#month']);
        monthlyBeneficiaries.push(element['#beneficiaries']);
        monthlyTransfer.push(element['#value']);
        globalMonthlyData[element['#meta+code']] = {'date':element['#month'],'value':element['#value'],'beneficiaries':element['#beneficiaries'],'link':element['#meta+link']};

    });
    generateLineCharts([monthlyMonths, monthlyBeneficiaries],'#yearlyChart');
    generateLineCharts([monthlyMonths, monthlyTransfer], '#monthlyChart');
    generateKeyFigures(config.lastUpdateMonth, config.lastUpdateYear);
    updateMonthlyData(config.lastDataURL);

});

function updateMonthlyData (dataURL, fonction) {
    $('.monthly-viz-container').hide();
    $('.loader').show();
    var geomCall = $.ajax({
        type: 'GET',
        url: config.geo,
        dataType: 'json',
    });

    var monthlyCall = $.ajax({
        type: 'GET',
        url: dataURL,
        dataType: 'json'
    });

    $.when(monthlyCall, geomCall).then(function (dataArgs, geomArgs) {

        var data = hxlProxyToJSON(dataArgs[0]);
        var geom = geomArgs[0];
        geom.features.forEach(function (e) {
            e.properties[config.joinAttribute] = String(e.properties[config.joinAttribute]);
        });
        generate3WComponent(data, geom);
    });

} // fin updateMonthlyData


