import React, { Component } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import _ from "lodash";

import Map from "./Map";
import MigrationLine from "./MigrationLine";

function migrationSources(data, centroids, nameIdMap) {
    return Object.keys(data.sources)
        .filter(name => centroids[nameIdMap[name]])
        .filter(name => data.sources[name] !== 0);
}

const CountryMigrations = ({ data, nameIdMap, centroids }) => {
    const destination = centroids[data.id];

    const sources = migrationSources(data, centroids, nameIdMap),
        extent = d3.extent(sources.map(name => data.sources[name])),
        color = d3
            .scaleLog()
            .domain(extent)
            .range([0, 1]);

    const N = d3
        .scaleLinear()
        .domain(extent)
        .range([1, 10]);

    return (
        <g>
            {sources.map((name, i) => (
                <MigrationLine
                    start={centroids[nameIdMap[name]]}
                    end={destination}
                    color={d3.interpolateWarm(color(data.sources[name]))}
                    key={`${data.id}-${i}`}
                    Ncircles={N(data.sources[name])}
                />
            ))}
        </g>
    );
};

const Migrations = ({
    topology,
    projection,
    data,
    nameIdMap,
    focusCountry
}) => {
    if (!data) {
        return null;
    }

    const countries = topojson.feature(topology, topology.objects.countries),
        path = d3.geoPath(projection),
        centroids = _.fromPairs(
            countries.features.map(country => [
                country.id,
                path.centroid(country)
            ])
        );

    const dataToDraw = data
        .filter(({ id }) => id === focusCountry)
        .filter(({ id }) => !!centroids[id]);

    return (
        <g>
            {dataToDraw.map(data => (
                <CountryMigrations
                    data={data}
                    nameIdMap={nameIdMap}
                    centroids={centroids}
                    key={`migrations-${data.id}`}
                />
            ))}
        </g>
    );
};

class World extends Component {
    state = {
        topology: null,
        zoomInitted: false,
        transform: null
    };

    projection = d3
        .geoEquirectangular()
        .center([-50, 40])
        .scale(200);

    zoom = d3
        .zoom()
        .scaleExtent([0.5, 10])
        .on("zoom", this.onZoom.bind(this));

    componentWillMount() {
        d3.json("data/world-110m.v1.json", (err, topology) => {
            this.setState({
                topology: topology
            });
        });
    }

    componentDidUpdate() {
        if (!this.state.zoomInitted && this.state.topology) {
            const svg = d3.select(this.refs.svg);

            svg.call(this.zoom);

            this.setState({
                zoomInitted: true
            });
        }
    }

    onZoom() {
        this.setState({
            transform: d3.event.transform
        });
    }

    get transform() {
        if (this.state.transform) {
            const { x, y, k } = this.state.transform;
            return `translate(${x}, ${y}) scale(${k})`;
        } else {
            return null;
        }
    }

    render() {
        const { width, height, data } = this.props,
            { topology } = this.state;

        if (!topology || !data) {
            return null;
        }

        return (
            <svg width={width} height={height} ref="svg">
                <g transform={this.transform}>
                    <Map
                        topology={topology}
                        projection={this.projection}
                        data={this.props.data}
                        nameIdMap={this.props.nameIdMap}
                        focusCountry={this.props.focusCountry}
                    />
                    <Migrations
                        topology={topology}
                        projection={this.projection}
                        data={this.props.data}
                        nameIdMap={this.props.nameIdMap}
                        focusCountry={this.props.focusCountry}
                    />
                </g>
            </svg>
        );
    }
}

export { World };
