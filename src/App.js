import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import './App.css';

import { World } from './Maps';

class App extends Component {
    state = {
        data: null
    }

    componentWillMount() {
        d3.queue()
          .defer(d3.csv, 'data/UN_MigrantStockByOriginAndDestination_2015_cleaned.csv',
                 (row) => ({
                     id: row['Country code'],
                     name: row['Major area, region, country or area of destination'],
                     sources: _.mapValues(row, v => Number(v.replace(/ /g, '')))
                 }))
          .await((err, data) => {
              this.setState({
                  data: data,
                  nameIdMap: _.fromPairs(data.map(({ id, name }) => [name, id]))
              });
          });
    }

    render() {
        return (
            <div className="App">
                <p className="App-intro">
                    <World width={1440} height={1080}
                           data={this.state.data} nameIdMap={this.state.nameIdMap} />
                </p>
            </div>
        );
    }
}

export default App;
