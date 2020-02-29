var Container = require('../common/container'),
    widgetManager = require('../../managers/widgets'),
    parser = require('../../parser'),
    html = require('nanohtml'),
    raw = require('nanohtml/raw'),
    {enableTraversingGestures, disableTraversingGestures} = require('../../events/drag'),
    setScrollbarColor = require('../../ui/scrollbar-color')

class Panel extends Container() {

    static description() {

        return 'Widgets or Tabs container.'

    }

    static defaults() {

        return super.defaults({

            _panel:'panel',

            colorPanel: {type: 'string', value: 'auto', help:''},
            layout: {type: 'string', value: 'default', choices: ['default', 'vertical', 'horizontal', 'grid'], help:''},
            gridTemplate: {type: 'string|number', value: '', help:'If `layout` is `grid`, can be either a number of columns of a value css grid-template definition.'},
            traversing: {type: 'boolean', value: false, help: 'Set to `true` to enable traversing gestures in this widget. Set to `smart` or `auto` to limit affected widgets by the type of the first touched widget'},
            scroll: {type: 'boolean', value: true, help: 'Set to `false` to disable scrollbars'},
            variables: {type: '*', value: '@{parent.variables}', help: 'Defines one or more arbitrary variables that can be inherited by children widgets'},

        }, [], {

            widgets: {type: 'array', value: [], help: 'Each element of the array must be a widget object. A panel cannot contain widgets and tabs simultaneously.'},
            tabs: {type: 'array', value: [], help: 'Each element of the array must be a tab object. A panel cannot contain widgets and tabs simultaneously'},

            value: {type: 'integer', value: '', help: [
                'Defines currently widgeted tab in the widget',
                'A tab can be opened only by setting its parent\'s value'
            ]},

        })


    }

    constructor(options) {


        super({...options, html: html`<inner></inner>`})

        this.container.classList.toggle('no-scroll', this.getProp('scroll') === false)
        this.container.classList.add('layout-' + this.getProp('layout'))

        if (this.getProp('layout') === 'grid') {
            var template = this.getProp('gridTemplate') || 2
            this.widget.style.gridTemplate = template === parseInt(template) ? `none / repeat(${template}, 1fr)` : template
        }

        if (this.getProp('tabs') && this.getProp('tabs').length) {

            this.container.classList.add('contains-tabs')

        } else {

            this.container.classList.add('contains-widgets')

        }




        this.tabs = []

        if (this.getProp('tabs') && this.getProp('tabs').length) {

            this.value = -1

            this.navigation = this.widget.appendChild(html`<div class="navigation"></div>`)

            this.children = options.children || new Array(this.getProp('tabs').length)
            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i]) {
                    this.widget.appendChild(this.children[i].container)
                    this.children[i].mounted = true
                    this.children[i].parent = this
                    this.children[i].parentNode = this.widget
                } else {
                    parser.parse({
                        data: this.getProp('tabs')[i],
                        parentNode: this.widget,
                        parent: this,
                        tab: true,
                        index: i
                    })
                }
            }

            if (options.children) this.alignChildrenProps()

            this.createNavigation()

            this.navigation.addEventListener('fast-click', (e)=>{
                if (!e.target.hasAttribute('data-widget')) return
                var index = DOM.index(e.target)
                this.setValue(index, {sync: true, send:this.value != index})
            })

            this.on('tab-created', (e)=>{
                this.createNavigation()
                e.stopPropagation = true
            })

            this.setValue(this.getProp('value') || 0)

        } else if (this.getProp('widgets') && this.getProp('widgets').length) {

            this.children = options.children || new Array(this.getProp('widgets').length)
            for (let i = 0; i < this.children.length; i++) {
                if (this.children[i]) {
                    this.widget.appendChild(this.children[i].container)
                    this.children[i].mounted = true
                    this.children[i].parent = this
                    this.children[i].parentNode = this.widget
                } else {
                    parser.parse({
                        data: this.getProp('widgets')[i],
                        parentNode: this.widget,
                        parent: this,
                        index: i
                    })
                }
            }

            if (options.children) this.alignChildrenProps()


        }

        if (this.getProp('traversing')) this.setTraversing()

    }

    createNavigation() {

        this.navigation.innerHTML = ''
        this.tabs = []

        DOM.each(this.widget, '> .widget', (tab)=>{

            let widget = widgetManager.getWidgetByElement(tab),
                style = ''

            style += widget.getProp('colorWidget') === 'auto' ? '' : `--color-widget:${widget.getProp('colorWidget')};`
            style += widget.getProp('colorFill') === 'auto' ? '' : `--color-fill:${widget.getProp('colorFill')};`
            style += widget.getProp('colorText') === 'auto' ? '' : `--color-text:${widget.getProp('colorText')};`

            if (!widget.getProp('visible')) style += 'display:none;'

            this.tabs.push(widget)
            this.navigation.appendChild(html`
                <div class="tablink" data-widget="${widget.hash}" style="${style}">
                    ${raw(widget.label.innerHTML)}
                </div>
            `)

        })


        this.setValue(this.value)

    }

    setValue(v, options={}) {
        if (this.tabs.length && typeof v == 'number' && v >= 0 && v < this.tabs.length) {

            for (let i in this.tabs) {
                if (i != v) this.tabs[i].hide()
            }

            this.value = v

            this.tabs[v].show()
            DOM.each(this.navigation, 'div', (el)=>{el.classList.remove('on')})[v].classList.add('on')

            if (options.send) this.sendValue()
            if (options.sync) this.changed(options)

        }
    }

    scroll(s) {

        if (!s) {
            return [this.widget.scrollLeft, this.widget.scrollTop]
        } else {
            this.widget.scrollLeft = s[0]
            this.widget.scrollTop = s[1]
        }

    }

    onPropChanged(propName, options, oldPropValue) {

        if (super.onPropChanged(...arguments)) return true

        switch (propName) {

            case 'traversing':
                this.setTraversing()
                return

            case 'colorText':
            case 'colorWidget':
            case 'colorFill':
            case 'colorStroke':
            case 'alphaStroke':
            case 'alphaFillOff':
            case 'alphaFillOn':
            case 'colorPanel':
            case 'padding':
                for (var w of this.children) {
                    if (w) w.onPropChanged(propName)
                }
                return

        }

    }

    setCssVariables() {

        super.setCssVariables()
        setScrollbarColor(this.container)

    }

    setTraversing(update) {

        var traversing = this.getProp('traversing')

        disableTraversingGestures(this.widget)

        if (traversing) {
            enableTraversingGestures(this.widget, {smart: typeof traversing === 'string' && traversing.match(/smart|auto/)})
        }

    }


    onRemove() {
        this.off('resize')
        super.onRemove()
    }

}

Panel.dynamicProps = Panel.prototype.constructor.dynamicProps.concat(
    'variables',
    'traversing'
)

module.exports = Panel