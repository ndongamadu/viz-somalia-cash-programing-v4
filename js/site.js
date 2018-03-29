var config = {
    data: "data/cash-october.json",
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

function generateSettings(dateOfData, metadata) {
    $('#dateOfData a').text(dateOfData);
    $('#methodology p').text(metadata);
}

var monthlyMonths = ['x'],
    monthlyBeneficiaries = ['Beneficiaries'],
    monthlyTransfer = ['Transfer value'];

function checkIntData(d){
    return (isNaN(parseInt(d)) || parseInt(d)<0) ? 0 : parseInt(d);
}

function generate3WComponent(config, data, geom) {

    var lookup = genLookup(geom, config);

    var whoChart = dc.rowChart('#hdx-3W-who');
    var whatChart = dc.rowChart('#hdx-3W-what');
    var whereChart = dc.leafletChoroplethChart('#hdx-3W-where');

    var whoRegional = dc.rowChart('#regionalCash');

    var filterMechanismPie = dc.pieChart('#filterMechanism');
    var filtercondPie = dc.pieChart('#filterConditionality');
    var filterRestPie = dc.pieChart('#filterRestriction');
    var filterRuralUrban = dc.pieChart('#filterArea');



    var peopleAssisted = dc.numberDisplay('#peopleAssisted');
    var amountTransfered = dc.numberDisplay('#amountTransfered');
    var numberOrgs = dc.numberDisplay('#numberOrgs');
    //var numberClusters = dc.numberDisplay('#numberClusters');

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



    var gp = cf.groupAll().reduce(
        function (p, v) {
            p.peopleAssisted += +v[config.sumField];
            // p.amountTransfered += +v["Estimated"];
            p.amountTransfered += +v[config.estimatedField];


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
            p.amountTransfered -= +v[config.estimatedField];

            p.orgas[v[config.whoFieldName]]--;
            if (p.orgas[v[config.whoFieldName]] == 0) {
                delete p.orgas[v[config.whoFieldName]];
                p.numOrgs--;
            }

            return p;
        },
        function () {
            return {
                peopleAssisted: 0,
                amountTransfered: 0,
                numOrgs: 0,
                orgas: {}
            };

        }
    );

    var all = cf.groupAll();
    //tooltip
    var rowtip = d3.tip().attr('class', 'd3-tip').html(function (d) {
        return d.key + ': ' + d3.format('0,000')(d.value);

    });

    //tooltip
    var slicetip = d3.tip().attr('class', 'd3-tip').html(function (d) {
        return d.data.key + ': ' + d3.format('0,000')(d.value);
    });

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



    var peopleA = function (d) {
        return d.peopleAssisted;
    };

    var amountT = function (d) {
        return d.amountTransfered;
    };

    var numO = function (d) {
        return d.numOrgs;
    };

    var numAvg = function (d) {
        return d.avg;
    };

    peopleAssisted.group(gp)
        .valueAccessor(peopleA)
        .html({
            none: "<span style=\"color:#03a9f4; font-size: 26px;\">unavailable</span>"
        })
        .formatNumber(formatDecimalComma);
    //        .formatNumber(formatComma);

    amountTransfered.group(gp)
        .valueAccessor(amountT)
        .html({
            none: "<span style=\"color:#03a9f4; font-size: 26px;\">unavailable</span>"
        })
        .formatNumber(formatMoney);

    numberOrgs.group(gp)
        .valueAccessor(numO)
        .formatNumber(formatDecimalComma);


    dc.renderAll();

    d3.selectAll('g.row').call(rowtip);
    d3.selectAll('g.row').on('mouseover', rowtip.show).on('mouseout', rowtip.hide);

    d3.selectAll('g.pie-slice').call(slicetip);
    d3.selectAll('g.pie-slice').on('mouseover', slicetip.show).on('mouseout', slicetip.hide);


    var map = whereChart.map();

    zoomToGeom(geom);


    var g = d3.selectAll('#hdx-3W-who').select('svg').append('g');



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


}

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
                    format: '%b %Y'
                }
            },
            y: {
                tick: {
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

var settingCall = $.ajax({
    type: 'GET',
    url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1PZuC-Kf206kUcizDhz9qtWPR7hvc9hlfDJwirNbaPbk%2Fedit%3Fusp%3Dsharing',
    dataType: 'json',
})


var dataCall = $.ajax({
    type: 'GET',
    url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1PZuC-Kf206kUcizDhz9qtWPR7hvc9hlfDJwirNbaPbk%2Fedit%23gid%3D251024910',
    dataType: 'json',
});

//load geometry

var geomCall = $.ajax({
    type: 'GET',
    url: config.geo,
    dataType: 'json',
});

var monthlyCall = $.ajax({
    type: 'GET',
    url: 'https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A%2F%2Fdocs.google.com%2Fspreadsheets%2Fd%2F1PZuC-Kf206kUcizDhz9qtWPR7hvc9hlfDJwirNbaPbk%2Fedit%23gid%3D1868352423',
    dataType: 'json'
})

//when both ready construct 3W

$.when(settingCall, dataCall, monthlyCall, geomCall).then(function (settingsArgs, dataArgs, monthlyArgs, geomArgs) {
    //date and metholodology generate
    var settingsData = hxlProxyToJSON(settingsArgs[0]);
    generateSettings(settingsData[0]['#indicator+last_update'], settingsData[0]['#indicator+methodology']);

    //monthly data generate
    var monthlyData = hxlProxyToJSON(monthlyArgs[0]);
    
    monthlyData.forEach(function (element) {
        monthlyMonths.push(element['#month']);
        monthlyBeneficiaries.push(element['#beneficiaries']);
        monthlyTransfer.push(element['#value']);

    });

    generateLineCharts([monthlyMonths, monthlyBeneficiaries],'#yearlyChart');
    generateLineCharts([monthlyMonths, monthlyTransfer], '#monthlyChart');

    var data = hxlProxyToJSON(dataArgs[0]);

    // var monthlyData = monthlyArgs[0]
    var geom = geomArgs[0];

    geom.features.forEach(function (e) {
        e.properties[config.joinAttribute] = String(e.properties[config.joinAttribute]);
    });

    generate3WComponent(config, data, geom);
});
