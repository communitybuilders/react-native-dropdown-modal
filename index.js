/**
 * Created by Dejan Lukic on 13/1/17.
 */
'use strict';

import React, {Component} from 'react';
import PropTypes from 'prop-types';

const ReactNative = require('react-native');

const {
  View,
  Text,
  TextInput,
  FlatList,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} = ReactNative;
import {TextPropTypes, ViewPropTypes} from 'deprecated-react-native-prop-types';

import Icon from 'react-native-vector-icons/FontAwesome';

class Dropdown extends Component {
  static propTypes = {
    ...TextInput.propTypes,
    /**
     * The data source for the dropdown menu. Can be an array or an object.
     */
    data: PropTypes.oneOfType([
      PropTypes.array,
      PropTypes.object,
    ]).isRequired,
    /**
     * The FontAwesome icon name to use for the dropdown component.
     */
    iconName: PropTypes.string,
    /**
     * Styles to apply to the Icon component.
     */
    iconStyle: TextPropTypes.style,
    /**
     * Styles to apply to the container view for the Icon component
     */
    iconContainerStyle: ViewPropTypes.style,
    /**
     * The FontAwesome icon name to use for the close button in the footer
     * of the ListView when the dropdown is open.
     */
    closeIconName: PropTypes.string,
    /**
     * Styles to apply to the close Icon component.
     */
    closeIconStyle: TextPropTypes.style,
    /**
     * Styles to apply to the modal ListView when the dropdown is open.
     */
    modalStyle: ViewPropTypes.style,
    /**
     * Styles to apply to the individual items of the dropdown.
     */
    dropdownItemStyle: TextPropTypes.style,
    /**
     * The initially selected index of the dropdown.
     */
    defaultSelectedIndex: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ]),
    /**
     * The selected index of the dropdown (makes this a controlled input)
     */
    selectedIndex: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string
    ]),
    /**
     * The property to use for the dropdown titles if the data source
     * is an object/map.
     * @use Dropdown.titlePropMapKey to use map keys as titles
     * @use Dropdown.titlePropMapValue to use map values as titles
     */
    titleProperty: PropTypes.string,
    /**
     * Callback function when an option is selected from the
     * dropdown menu.
     */
    onOptionSelected: PropTypes.func,
    /**
     * Callback when the selected index is changed and the
     * dropdown component is updated.
     */
    onSelectedIndexChange: PropTypes.func,
    /**
     * An identifier for this component that will be passed as the second
     * parameter to onOptionSelected.
     */
    id: PropTypes.any
  };

  static defaultProps = {
    data: [],
    iconName: 'chevron-down',
    closeIconName: 'times-circle-o'
  };

  static titlePropMapKey = "_dropdown_title_prop_map_key_";
  static titlePropMapValue = "_dropdown_title_prop_map_value_";

  constructor(props) {
    super(props);

    this.state = {
      data: [],
      showModal: false,
      selectedIndex: Dropdown._getInitialSelectedIndex(props),
    };
  }

  static getDerivedStateFromProps(props, state) {
    let nextState = {};

    if (props.data !== state.data) {
      nextState.data = nextState.formattedData = props.data;
      nextState.isMap = false;

      if (!Array.isArray(props.data)) {
        // If it's a map, format the data
        nextState.formattedData = Dropdown.mapToArray(props.data);
        nextState.isMap = true;
      }

      // Ensure we also set the initial index.
      nextState.selectedIndex = Dropdown._getInitialSelectedIndex(props);
    }

    if (props.selectedIndex && props.selectedIndex !== state.selectedIndex) {
      nextState.selectedIndex = props.selectedIndex;
    }

    return nextState;
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.selectedIndex !== this.state.selectedIndex) {
      this.props.onSelectedIndexChange && this.props.onSelectedIndexChange(prevState.selectedIndex, this.state.selectedIndex);
    }
  }

  componentDidMount() {
    const originalFunc = this.textInput._onPress;

    // Override the _onPress event for our TextInput.
    this.textInput._onPress = (event) => {
      this._toggleModal(true);

      originalFunc(event);
    };
  }

  static _getInitialSelectedIndex(props) {
    let selectedIndex = props.selectedIndex;
    if (selectedIndex !== undefined) {
      return selectedIndex;
    }

    if (props.defaultSelectedIndex !== undefined) {
      // Return the default selected index if one is set and
      // there is no selectedIndex.
      return props.defaultSelectedIndex;
    }

    for (let index in props.data) {
      if (props.data.hasOwnProperty(index)) {
        // Return the first index.
        return index;
      }
    }

    return selectedIndex;
  }

  /**
   * Gets the title for the given index.
   * If index is undefined, returns the first result in our data-set.
   *
   * @param index
   * @private
   */
  _getTitle(item) {
    if (item === undefined) {
      return '';
    }

    let key;
    if (this.state.isMap) {
      // Extract key/value
      key = item.key;
      item = item.value;
    }

    if (this.props.titleProperty) {
      if (this.props.titleProperty === Dropdown.titlePropMapKey) {
        // The map keys are our titles.
        return key;
      }

      if (this.props.titleProperty !== Dropdown.titlePropMapValue) {
        // If we have a title property (other than a map value as a title),
        // then dig into our array and retrieve the title from the
        // titleProperty.
        if (item.hasOwnProperty(this.props.titleProperty)) {
          return item[ this.props.titleProperty ];
        }
      }
    }

    return typeof item !== 'undefined' ? item : '';
  }

  _onSelectOption(item, index) {
    if (this.state.isMap) {
      index = item?.key;
    }

    this.props.onOptionSelected && this.props.onOptionSelected(index, this.props.id);

    let nextState = {
      showModal: false
    };

    if (this.props.selectedIndex === undefined || this.props.selectedIndex === index) {
      // selectedIndex makes the dropdown a controlled input.
      nextState.selectedIndex = index;
    }

    this.setState(nextState);
  }

  get selectedItem() {
    const data = this.state.formattedData;
    if (this.state.isMap) {
      return data.find(item => item.key === this.state.selectedIndex);
    }

    return data[ this.state.selectedIndex ];
  }

  _onCloseButtonPress() {
    this.setState({showModal: false});
  }

  renderItem({item, index}) {
    let title;

    if (typeof item === 'string') {
      title = item;
    }else {
      title = this._getTitle(item);
    }

    return (
      <TouchableOpacity
        onPress={() => this._onSelectOption(item, index)}>
        <View>
          <Text
            style={[ styles.listViewItem, this.props.dropdownItemStyle ]}>{title}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  _renderFooter() {
    return (
      <TouchableOpacity
        onPress={this._onCloseButtonPress.bind(this)}>
        <Icon
          name={this.props.closeIconName}
          style={this.props.closeIconStyle}
        />
      </TouchableOpacity>);
  }

  _onPress() {
    this.props.onPress && this.props.onPress();

    this._toggleModal(true);
  }

  _toggleModal = (showModal) => {
    // Dismissing keyboard ensures that any focused input will no longer
    // be focused after tapping the dropdown.
    Keyboard.dismiss();

    this.setState({showModal});
  };

  static mapToArray(map) {
    return Object.keys(map).map(key => {
      return {
        key,
        value: map[ key ]
      }
    });
  }

  render() {
    let listViewContentContainerStyle = [ styles.listViewContentContainer ];

    const title = this._getTitle(this.selectedItem);

    return (
      <View style={this.props.style}>
        <TouchableOpacity
          style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}
          onPress={this._onPress.bind(this)}>
          <Text
            style={[ styles.dropdown, {flex: 1} ]}
            ref={(ref) => this.textInput = ref}>{String(title)}</Text>

          <View style={{flexDirection: 'column'}}>
            <View
              style={[ styles.iconContainer, this.props.iconContainerStyle ]}>
              <Icon
                style={[ styles.icon, this.props.iconStyle ]}
                name={this.props.iconName}
              />
            </View>
          </View>
        </TouchableOpacity>

        <Modal
          animationType={"fade"}
          visible={this.state.showModal}
          transparent={true}
          onRequestClose={this._onCloseButtonPress.bind(this)}
          supportedOrientations={[ 'portrait', 'landscape' ]}
        >

          {this.state.formattedData.length > 0 ?
            <FlatList
              contentContainerStyle={listViewContentContainerStyle}
              style={[ styles.listView, this.props.modalStyle ]}
              data={this.state.formattedData}
              renderItem={this.renderItem.bind(this)}
              renderFooter={this._renderFooter.bind(this)}
              enableEmptySections={true}
              keyboardShouldPersistTaps="always"
              centerContent={true}
            />
            : null}
        </Modal>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: '#fff',
    color: '#000'
  },
  iconContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center'
  },
  icon: {
    paddingLeft: 15,
    paddingRight: 15
  },
  listView: {
    backgroundColor: '#cecece'
  },
  listViewContentContainer: {
    paddingBottom: 20,
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  listViewItem: {
    paddingTop: 10,
    paddingBottom: 10
  }
});

export default Dropdown;
module.exports = Dropdown;
