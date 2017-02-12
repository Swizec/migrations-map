
import React, { Component } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import _ from 'lodash';

const Map = ({ topology, projection }) => {
    const D = d3.geoPath(projection),
          countries = topojson.feature(topology, topology.objects.countries);

    return (
       <g>
           {countries.features.map((country, i) => (
               <path d={D(country)}
                     key={`${country.id}-${i}`}
                     style={{stroke: 'white',
                             strokeWidth: '0.25px',
                             fill: 'grey'}} />
            ))}
       </g>
    );
};

const Curve = ({ start, end, color }) => {
    const line = d3.line()
                   .curve(d3.curveBasis),
          [x1, y1] = start,
          [x2, y2] = end,
          middle = [(x1 + x2)/2, (y1 + y2)/2-200];

    return (
        <path d={line([start, middle, end])}
              style={{stroke: color,
                      strokeWidth: '1.6px',
                      strokeOpacity: '0.7',
                      fillOpacity: 0}} />
    );
};

const CountryMigrations = ({ data, nameIdMap, centroids }) => {
    const destination = centroids[data.id];

    /* console.log(Object.values(data.sources)
       .filter(d => !Number.isNaN(d))
       .reduce((d, sum) => d+sum, 0)); */

    const sources = Object.keys(data.sources)
                          .filter(name => centroids[nameIdMap[name]])
                          .filter(name => data.sources[name] !== 0),
          color = d3.scaleLog()
                    .domain(d3.extent(sources.map(name => data.sources[name])))
                    .range([0, 1]);

    console.log(d3.extent(sources.map(name => data.sources[name])));

    return (
        <g>
            {sources.map((name, i) => (
                <Curve start={centroids[nameIdMap[name]]} end={destination}
                       color={d3.interpolateWarm(color(data.sources[name]))}
                       key={`${data.id}-${i}`} />
             ))}
        </g>
    )
};

const Migrations = ({ topology, projection, data, nameIdMap, focusCountry }) => {
    if (!data) {
        return null;
    }

    const countries = topojson.feature(topology, topology.objects.countries),
          path = d3.geoPath(projection),
          centroids = _.fromPairs(countries.features
                                           .map(country => [country.id,
                                                            path.centroid(country)]));

    const dataToDraw = data.filter(({ id }) => id === focusCountry)
                           .filter(({ id }) => !!centroids[id]);

    return (
        <g>
            {dataToDraw.map(data => (
                <CountryMigrations data={data} nameIdMap={nameIdMap}
                                   centroids={centroids}
                                   key={`migrations-${data.id}`} />
            ))}
        </g>
    );
};

class World extends Component {
    state = {
        topology: null
    }

    projection = d3.geoEquirectangular()
                   .center([-50, 40])
                   .scale(200)

    componentWillMount() {
        d3.json('data/world-110m.v1.json',
                (err, topology) => {
                    this.setState({
                        topology: topology
                    });
                });
    }

    render() {
        const { width, height } = this.props,
              { topology } = this.state;

        if (!topology) {
            return null;
        }

        return (
            <svg width={width} height={height}>
                <Map topology={topology} projection={this.projection} />
                <Migrations topology={topology} projection={this.projection}
                            data={this.props.data} nameIdMap={this.props.nameIdMap}
                            focusCountry={this.props.focusCountry} />
            </svg>
        )
    }
}

export { World };
