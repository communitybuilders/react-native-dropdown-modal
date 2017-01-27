/**
 * Created by Dejan Lukic on 13/1/17.
 */
'use strict';

import React, {Component, PropTypes} from 'react';
const ReactNative = require('react-native');

const {
    View,
    Text,
    TextInput,
    ListView,
    Modal,
    TouchableOpacity,
    StyleSheet,
    Keyboard
} = ReactNative;

import Icon from 'react-native-vector-icons/FontAwesome';

class Dropdown extends Component {
    static propTypes = {
        ...TextInput.propTypes,
        /**
         * The data source for the dropdown menu. Can be an array or an object.
         */
        dataSource: PropTypes.oneOfType([
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
        iconStyle: Icon.propTypes.style,
        /**
         * Styles to apply to the container view for the Icon component
         */
        iconContainerStyle: View.propTypes.style,
        /**
         * The FontAwesome icon name to use for the close button in the footer
         * of the ListView when the dropdown is open.
         */
        closeIconName: PropTypes.string,
        /**
         * Styles to apply to the close Icon component.
         */
        closeIconStyle: Icon.propTypes.style,
        /**
         * Styles to apply to the modal ListView when the dropdown is open.
         */
        modalStyle: ListView.propTypes.style,
        /**
         * Styles to apply to the individual items of the dropdown.
         */
        dropdownItemStyle: Text.propTypes.style,
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
         * An identifier for this component that will be passed as the second parameter to onOptionSelected.
         */
        id: PropTypes.any
    };

    static defaultProps = {
        dataSource: [],
        iconName: 'chevron-down',
        closeIconName: 'times-circle-o'
    };

    static titlePropMapKey = "_dropdown_title_prop_map_key_";
    static titlePropMapValue = "_dropdown_title_prop_map_value_";

    constructor(props) {
        super(props);

        let dataSource = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});

        this.dataSourceIsMap = !Array.isArray(props.dataSource) && typeof props.dataSource === 'object';

        this.state = {
            ds: dataSource.cloneWithRows(props.dataSource),
            showModal: false,
            selectedIndex: this._getInitialSelectedIndex(),
            flexListViewContentContainer: false
        };
    }

    componentWillReceiveProps(nextProps) {
        let nextState = {};
        let updateState = false;

        if( nextProps.dataSource !== this.props.dataSource ) {
            updateState = true;

            nextState.ds = this.state.ds.cloneWithRows(nextProps.dataSource);
        }

        if( nextProps.selectedIndex !== this.props.selectedIndex ) {
            updateState = true;

            nextState.selectedIndex = nextProps.selectedIndex;
        }

        if( updateState === true ) {
            this.setState(nextState);
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if( prevState.selectedIndex !== this.state.selectedIndex ) {
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

    _getInitialSelectedIndex() {
        let selectedIndex = this.props.selectedIndex;

        if( selectedIndex === undefined ) {
            if( this.props.defaultSelectedIndex !== undefined ) {
                return this.props.defaultSelectedIndex;
            }

            if( this.dataSourceIsMap ) {
                return this._getKeyFromMap(selectedIndex);
            }

            return 0;
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
    _getTitle(index) {
        if( this.props.titleProperty ) {
            if( this.props.titleProperty === Dropdown.titlePropMapKey ) {
                // The map keys are our titles.
                return index;
            }

            if( this.props.titleProperty !== Dropdown.titlePropMapValue ) {
                // If we have a title property (other than a map value as a title),
                // then dig into our array and retrieve the title from the titleProperty.
                let rowData = this.state.ds.getRowData(0, index);

                if( typeof rowData === 'object' ) {
                    if( rowData.hasOwnProperty(this.props.titleProperty) ) {
                        return rowData[ this.props.titleProperty ];
                    }
                }
            }
        }

        return typeof this.props.dataSource[ index ] !== 'undefined' ? this.props.dataSource[ index ] : '';
    }

    /**
     * If index is undefined, returns the first key of our map.
     *
     * @param {number|undefined} index
     * @returns {*}
     * @private
     */
    _getKeyFromMap(index) {
        if( index === undefined ) {
            for( index in this.props.dataSource ) {
                if( this.props.dataSource.hasOwnProperty(index) ) {
                    break;
                }
            }
        }

        return index;
    }

    _onSelectOption(selectedIndex) {
        this.props.onOptionSelected && this.props.onOptionSelected(selectedIndex, this.props.id);

        let nextState = {
            showModal: false
        };

        if( this.props.selectedIndex === undefined || this.props.selectedIndex === selectedIndex ) {
            // selectedIndex makes the dropdown a controlled input.
            nextState.selectedIndex = selectedIndex;
        }

        this.setState(nextState);
    }

    _onCloseButtonPress() {
        this.setState({showModal: false});
    }

    renderRow(option, sectionID, rowID) {
        return (
            <TouchableOpacity
                onPress={() => this._onSelectOption(rowID)}>
                <View>
                    <Text style={[styles.listViewItem, this.props.dropdownItemStyle]}>{this._getTitle(rowID)}</Text>
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

    _toggleModal = (showModal) => {
        // Dismissing keyboard ensures that any focused input will no longer
        // be focused after tapping the dropdown.
        Keyboard.dismiss();

        this.setState({showModal});
    };

    _setFlexListViewContainer() {
        this.setState({flexListViewContentContainer: true});
    }

    _onEndReached = () => {
        if( !this.state.flexListViewContentContainer ) {
            let {visibleLength, contentLength} = this.listView.scrollProperties;

            if( contentLength < visibleLength ) {
                this._setFlexListViewContainer();
            }
        }
    };

    render() {
        let listViewContentContainerStyle = [styles.listViewContentContainer];

        if( this.state.flexListViewContentContainer ) {
            listViewContentContainerStyle.push({flex: 1});
        }

        return (
            <View style={this.props.style}>
                <TouchableOpacity
                    style={{flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}
                    onPress={this._toggleModal.bind(this, true)}>
                        <Text
                            style={[styles.dropdown, {flex: 1}]}
                            ref={(ref) => this.textInput = ref}>{String(this._getTitle(this.state.selectedIndex))}</Text>

                    <View style={{flexDirection: 'column'}}>
                        <View style={[styles.iconContainer, this.props.iconContainerStyle]}>
                            <Icon
                                style={[styles.icon, this.props.iconStyle]}
                                name={this.props.iconName}
                            />
                        </View>
                    </View>
                </TouchableOpacity>

                <Modal
                    animationType={"fade"}
                    visible={this.state.showModal}
                    transparent={true}
                    onRequestClose={this._onCloseButtonPress.bind(this)}>

                    {this.state.ds.getRowCount() ?
                        <ListView
                            onEndReached={this._onEndReached}
                            ref={(ele) => {this.listView = ele}}
                            contentContainerStyle={listViewContentContainerStyle}
                            style={[styles.listView, this.props.modalStyle]}
                            dataSource={this.state.ds}
                            renderRow={this.renderRow.bind(this)}
                            renderFooter={this._renderFooter.bind(this)}
                            enableEmptySections={true}
                            keyboardShouldPersistTaps={true}
                            centerContent={true}
                        />
                        : null }
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
