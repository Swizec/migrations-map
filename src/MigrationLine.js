
import React, { Component } from 'react';
import * as d3 from 'd3';

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
    state = {
        keepAnimating: false
    }

    duration = 3000

    _transform(circle, delay) {
        const { start } = this.props,
              [ x1, y1 ] = start;

        d3.select(circle)
          .attr("transform", `translate(${x1}, ${y1})`)
          .transition()
          .delay(delay)
          .duration(this.duration)
          .attrTween("transform", translateAlong(this.refs.path))
          .on("end", () => {
              if (this.state.keepAnimating) {
                  this._transform(circle, 0);
              }
          });
    }

    componentDidMount() {
        const { Ncircles } = this.props;

        this.setState({
            keepAnimating: true
        });

        const delayDither = this.duration*Math.random(),
              spread = this.duration/Ncircles;

        d3.range(delayDither, this.duration+delayDither, spread)
          .forEach((delay, i) =>
              this._transform(this.refs[`circles-${i}`], delay)
          );
    }

    componentWillUnmount() {
        const { Ncircles } = this.props;

        this.setState({
            keepAnimating: false
        });

        d3.range(Ncircles).forEach((circle, i) => {
            d3.select(this.refs[`circles-${i}`]).interrupt();
        })
    }

    render() {
        const { start, end, color, Ncircles } = this.props;
        const line = d3.line()
                       .curve(d3.curveBasis),
              [x1, y1] = start,
              [x2, y2] = end,
              middle = [(x1 + x2)/2, (y1 + y2)/2-200];

        return (
            <g>
                {d3.range(Ncircles).map(i => (
                    <circle r="3"
                            style={{fill: color, fillOpacity: 0.6}}
                            ref={`circles-${i}`}
                            key={`circle-${i}`} />
                ))}

                <path d={line([start, middle, end])}
                      style={{stroke: color,
                              strokeWidth: '1.6px',
                              strokeOpacity: 0.4,
                              fillOpacity: 0}}
                      ref="path"/>
            </g>
        )
    }
};


export default MigrationLine;
