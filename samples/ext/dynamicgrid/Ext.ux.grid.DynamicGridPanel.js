/**
* Ext.ux.grid.DynamicGridPanel
*/
Ext.define('Ext.ux.grid.DynamicGridPanel', {
    extend: 'Ext.grid.GridPanel',
    alias: 'widget.dynamicgrid',
    /**
    * initialising the components
    */
    initComponent: function(){
        /**
        * set the config we want
        */
        var config = {
            columns:[],
            rowNumberer: false
        };
         
        // appy to this config
        Ext.apply(this, config);
        // apply to the initialConfig
        Ext.apply(this.initialConfig, config);
        // call the arguments
        this.callParent(arguments);
    },
    /**
    * When the store is loading then reconfigure the column model of the grid
    */
    storeLoad: function()
    {
        /**
        * JSON data returned from server has the column definitions
        */
        if(typeof(this.store.proxy.reader.jsonData.columns) === 'object') {
            var columns = [];
            /**
            * adding RowNumberer as we need to add them 
            * before other columns to display first
            */
            if(this.rowNumberer) { columns.push(Ext.create('Ext.grid.RowNumberer')); }
            /**
            * assign new columns from the json data columns
            */
            Ext.each(this.store.proxy.reader.jsonData.columns, function(column){
                columns.push(column);
            });
            /**
            *  reconfigure the column model of the grid
            */
            this.reconfigure(this.store, columns);
        }
    },
    /**
    * assign the event to itself when the object is initialising
    */
    onRender: function(ct, position){
            /**
            *  well, old fashion way, but works well.
            */
            Ext.ux.grid.DynamicGridPanel.superclass.onRender.call(this, ct, position);
            /**
            * hook the store load event to our function
            */
            this.store.on('load', this.storeLoad, this);
    }
});