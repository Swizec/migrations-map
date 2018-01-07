import React from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import _ from "lodash";

function migrationSources(data, centroids, nameIdMap) {
    return Object.keys(data.sources)
        .filter(name => centroids[nameIdMap[name]])
        .filter(name => data.sources[name] !== 0);
}

const Map = ({ topology, projection, data, nameIdMap, focusCountry }) => {
    const D = d3.geoPath(projection),
        countries = topojson.feature(topology, topology.objects.countries),
        centroids = _.fromPairs(
            countries.features.map(country => [country.id, D.centroid(country)])
        ),
        idNameMap = _.invert(nameIdMap);

    console.log(data);

    let sources = [],
        focusData = data.find(({ id }) => id === focusCountry),
        colorScale = _.noop;

    if (focusData) {
        sources = migrationSources(focusData, centroids, nameIdMap);
        colorScale = d3
            .scaleLog()
            .domain(d3.extent(sources.map(name => focusData.sources[name])))
            .range([0, 1]);
    }

    const isSource = country => sources.includes(idNameMap[country.id]),
        color = country => {
            if (isSource(country) && focusData) {
                return d3.interpolateWarm(
                    colorScale(focusData.sources[idNameMap[country.id]])
                );
            } else {
                return "grey";
            }
        };

    return (
        <g>
            {countries.features.map((country, i) => (
                <path
                    d={D(country)}
                    key={`${country.id}-${i}`}
                    style={{
                        stroke: "white",
                        strokeWidth: "0.25px",
                        fillOpacity: isSource(country) ? 1 : 0.5,
                        fill: color(country)
                    }}
                />
            ))}
        </g>
    );
};

export default Map;
