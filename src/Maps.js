
import React, { Component } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import _ from 'lodash';

function migrationSources(data, centroids, nameIdMap) {
    return Object.keys(data.sources)
                 .filter(name => centroids[nameIdMap[name]])
                 .filter(name => data.sources[name] !== 0)
}

const Map = ({ topology, projection, data, nameIdMap, focusCountry }) => {
    const D = d3.geoPath(projection),
          countries = topojson.feature(topology, topology.objects.countries),
          centroids = _.fromPairs(countries.features
                                           .map(country => [country.id,
                                                            D.centroid(country)])),
          idNameMap = _.invert(nameIdMap);

    let sources = [],
        focusData = data.find(({ id }) => id === focusCountry),
        colorScale = _.noop;

    if (focusData) {
        sources = migrationSources(focusData,
                                   centroids, nameIdMap);
        colorScale = d3.scaleLog()
                       .domain(d3.extent(sources.map(name => focusData.sources[name])))
                       .range([0, 1]);
    }

    const isSource = (country) => sources.includes(idNameMap[country.id]),
          color = (country) => {
              if (isSource(country) && focusData){
                  return d3.interpolateWarm(colorScale(
                      focusData.sources[idNameMap[country.id]]
                  ));
              }else{
                  return 'grey';
              }
          };


    return (
       <g>
           {countries.features.map((country, i) => (
               <path d={D(country)}
                     key={`${country.id}-${i}`}
                     style={{stroke: 'white',
                             strokeWidth: '0.25px',
                             fillOpacity: isSource(country) ? 1 : 0.5,
                             fill: color(country)}} />
            ))}
       </g>
    );
};

function translateAlong(path) {
    var l = path.getTotalLength();
    return function(d, i, a) {
        return function(t) {
            var p = path.getPointAtLength(t * l);
            return "translate(" + p.x + "," + p.y + ")";
        };
    };
}

class MigrationLine extends Component {
    _transform(circle) {
        const { start } = this.props,
              [ x1, y1 ] = start;

        d3.select(circle)
          .attr("transform", `translate(${x1}, ${y1})`)
          .transition()
          .duration(1000)
          .attrTween("transform", translateAlong(this.refs.path))
          .on("end", () => this._transform(circle));
    }

    componentDidMount() {
        const circle = this.refs.circle;

        this._transform(circle);
    }

    render() {
        const { start, end, color } = this.props;
        const line = d3.line()
                       .curve(d3.curveBasis),
              [x1, y1] = start,
              [x2, y2] = end,
              middle = [(x1 + x2)/2, (y1 + y2)/2-200];

        return (
            <g>
                <circle r="3" style={{fill: color}} ref="circle" />

                <path d={line([start, middle, end])}
                      style={{stroke: color,
                              strokeWidth: '1.6px',
                              strokeOpacity: '0.7',
                              fillOpacity: 0}}
                      ref="path"/>
            </g>
        )
    }
};

const CountryMigrations = ({ data, nameIdMap, centroids }) => {
    const destination = centroids[data.id];

    const sources = migrationSources(data, centroids, nameIdMap),
          color = d3.scaleLog()
                    .domain(d3.extent(sources.map(name => data.sources[name])))
                    .range([0, 1]);

    return (
        <g>
            {sources.map((name, i) => (
                <MigrationLine start={centroids[nameIdMap[name]]}
                               end={destination}
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
                <Map topology={topology} projection={this.projection} data={this.props.data}
                     nameIdMap={this.props.nameIdMap} focusCountry={this.props.focusCountry} />
                <Migrations topology={topology} projection={this.projection}
                            data={this.props.data} nameIdMap={this.props.nameIdMap}
                            focusCountry={this.props.focusCountry} />
            </svg>
        )
    }
}

export { World };
