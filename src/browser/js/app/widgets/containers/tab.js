var Panel = require('./panel'),
    resize = require('../../events/resize'),
    editClean = function(){editClean = require('../../editor/edit-objects').editClean; editClean(...arguments)}



module.exports = class Tab extends Panel {

    static defaults() {

        return {
            type:'tab',
            id:'auto',

            _style:'style',

            label:'auto',
            color:'auto',
            css:'',

            _panel:'panel',

            layout:'',
            spacing:0,
            value:'',

            _osc:'osc',

            precision:0,
            address:'auto',
            preArgs:[],
            target:[],

            _children:'children',

            variables:'@{parent.variables}',

            widgets:[],
            tabs:[]
        }

    }

    constructor(options) {

        options.props.scroll = true

        super(options)

        this.container.classList.add('show')
        this.widget.classList.add('tab')

        this.detached = false

    }

    hide() {
        if (this.detached) return
        if (EDITING) editClean()
        this.container.removeChild(this.widget)
        this.container.classList.remove('show')
        this.detached = true

    }
    show() {
        if (!this.detached) return
        this.container.appendChild(this.widget)
        this.container.classList.add('show')
        this.detached = false
        resize.check(this.widget)
    }

    onPropChanged(propName, options) {

        var ret = super.onPropChanged(...arguments)

        switch (propName) {

            case 'color':
                if (this.parent.createNavigation) this.parent.createNavigation()
                return

        }

        return ret

    }

}
