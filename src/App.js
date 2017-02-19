import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';
import './App.css';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

import { World } from './Maps';

class App extends Component {
    state = {
        data: null,
        focusCountry: ""
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

    changeFocusCountry(country) {
        this.setState({
            focusCountry: country.value
        });
    }

    get countries() {
        const { data } = this.state;

        if (!data) return [];

        return data.map(({ id, name }) => ({ value: id, label: name }));
    }

    render() {
        return (
            <div className="App">
                <p className="App-intro">
                    <World width={1440} height={600}
                           data={this.state.data}
                           nameIdMap={this.state.nameIdMap}
                           focusCountry={this.state.focusCountry} />
                </p>
                <Select name="focusCountry"
                        value={this.state.focusCountry}
                        options={this.countries}
                        onChange={this.changeFocusCountry.bind(this)} />
            </div>
        );
    }
}

export default App;
