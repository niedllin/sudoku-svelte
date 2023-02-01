
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    // o estado do jogo guarda a informação sobre a tela questamos no momento
    let estado = writable('menu');

    function trocarEstadoDoJogo(novoEstado) {
    	estado.set(novoEstado);
    }

    /* src\VoltarMenu.svelte generated by Svelte v3.44.3 */
    const file$6 = "src\\VoltarMenu.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "MENU";
    			attr_dev(div, "class", "menu");
    			add_location(div, file$6, 4, 0, 70);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('VoltarMenu', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<VoltarMenu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => trocarEstadoDoJogo('menu');
    	$$self.$capture_state = () => ({ trocarEstadoDoJogo });
    	return [click_handler];
    }

    class VoltarMenu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VoltarMenu",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\Info.svelte generated by Svelte v3.44.3 */
    const file$5 = "src\\Info.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (74:4) {#each levels as level}
    function create_each_block$2(ctx) {
    	let li;
    	let t0_value = /*levelText*/ ctx[4][/*level*/ ctx[7]] + "";
    	let t0;
    	let t1;
    	let li_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*level*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();

    			attr_dev(li, "class", li_class_value = "" + (null_to_empty(/*level*/ ctx[7] === /*selectedDifficult*/ ctx[1]
    			? 'active'
    			: '') + " svelte-152n25f"));

    			add_location(li, file$5, 74, 6, 1305);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*selectedDifficult*/ 2 && li_class_value !== (li_class_value = "" + (null_to_empty(/*level*/ ctx[7] === /*selectedDifficult*/ ctx[1]
    			? 'active'
    			: '') + " svelte-152n25f"))) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(74:4) {#each levels as level}",
    		ctx
    	});

    	return block;
    }

    // (84:2) {#if isVictory}
    function create_if_block$2(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "VOCÊ CONSEGUIU!";
    			attr_dev(p, "class", "victory svelte-152n25f");
    			add_location(p, file$5, 84, 4, 1499);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(84:2) {#if isVictory}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let ul;
    	let t;
    	let each_value = /*levels*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	let if_block = /*isVictory*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(ul, "class", "level-menu svelte-152n25f");
    			add_location(ul, file$5, 72, 2, 1247);
    			attr_dev(div, "class", "container svelte-152n25f");
    			add_location(div, file$5, 70, 0, 1218);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*levels, selectedDifficult, handleChange, levelText*/ 30) {
    				each_value = /*levels*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (/*isVictory*/ ctx[0]) {
    				if (if_block) ; else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Info', slots, []);
    	let { isVictory } = $$props;
    	let { selectedDifficult } = $$props;
    	const dispatch = createEventDispatcher();

    	const handleChange = difficult => {
    		dispatch("change-difficult", difficult);
    	};

    	const levels = ["easy", "medium", "hard", "veryHard", "insane"];

    	const levelText = {
    		easy: "Fácil",
    		medium: "Médio",
    		hard: "Difícil",
    		veryHard: "Muito difícil",
    		insane: "Boa sorte!"
    	};

    	const writable_props = ['isVictory', 'selectedDifficult'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Info> was created with unknown prop '${key}'`);
    	});

    	const click_handler = level => handleChange(level);

    	$$self.$$set = $$props => {
    		if ('isVictory' in $$props) $$invalidate(0, isVictory = $$props.isVictory);
    		if ('selectedDifficult' in $$props) $$invalidate(1, selectedDifficult = $$props.selectedDifficult);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		isVictory,
    		selectedDifficult,
    		dispatch,
    		handleChange,
    		levels,
    		levelText
    	});

    	$$self.$inject_state = $$props => {
    		if ('isVictory' in $$props) $$invalidate(0, isVictory = $$props.isVictory);
    		if ('selectedDifficult' in $$props) $$invalidate(1, selectedDifficult = $$props.selectedDifficult);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [isVictory, selectedDifficult, handleChange, levels, levelText, click_handler];
    }

    class Info extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { isVictory: 0, selectedDifficult: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Info",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*isVictory*/ ctx[0] === undefined && !('isVictory' in props)) {
    			console.warn("<Info> was created without expected prop 'isVictory'");
    		}

    		if (/*selectedDifficult*/ ctx[1] === undefined && !('selectedDifficult' in props)) {
    			console.warn("<Info> was created without expected prop 'selectedDifficult'");
    		}
    	}

    	get isVictory() {
    		throw new Error("<Info>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isVictory(value) {
    		throw new Error("<Info>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedDifficult() {
    		throw new Error("<Info>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedDifficult(value) {
    		throw new Error("<Info>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Cell.svelte generated by Svelte v3.44.3 */
    const file$4 = "src\\Cell.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (135:2) {#if !cell.value}
    function create_if_block$1(ctx) {
    	let ul;
    	let each_value = /*options*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "pencil-container svelte-7kx00r");
    			add_location(ul, file$4, 135, 4, 2459);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options, cell*/ 9) {
    				each_value = /*options*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(135:2) {#if !cell.value}",
    		ctx
    	});

    	return block;
    }

    // (137:6) {#each options as option}
    function create_each_block$1(ctx) {
    	let li;
    	let t0_value = /*option*/ ctx[7] + "";
    	let t0;
    	let t1;
    	let li_class_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();

    			attr_dev(li, "class", li_class_value = "" + (null_to_empty(`option option${/*option*/ ctx[7]} ${/*cell*/ ctx[0].pencil.has(/*option*/ ctx[7])
			? 'visibleOption'
			: ''}`) + " svelte-7kx00r"));

    			add_location(li, file$4, 137, 8, 2529);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cell*/ 1 && li_class_value !== (li_class_value = "" + (null_to_empty(`option option${/*option*/ ctx[7]} ${/*cell*/ ctx[0].pencil.has(/*option*/ ctx[7])
			? 'visibleOption'
			: ''}`) + " svelte-7kx00r"))) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(137:6) {#each options as option}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let input;
    	let input_disabled_value;
    	let t;
    	let div_class_value;
    	let mounted;
    	let dispose;
    	let if_block = !/*cell*/ ctx[0].value && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t = space();
    			if (if_block) if_block.c();
    			input.disabled = input_disabled_value = /*cell*/ ctx[0].readonly;
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-7kx00r");
    			add_location(input, file$4, 133, 2, 2364);

    			attr_dev(div, "class", div_class_value = "" + (null_to_empty(`container
  ${/*cell*/ ctx[0].readonly ? 'readOnly' : 'notReadOnly'}
  ${/*cell*/ ctx[0].error ? 'hasError' : ''}
  ${/*cell*/ ctx[0].position === /*activePosition*/ ctx[1]
			? 'keyboardActive'
			: ''}
  ${/*highlightValue*/ ctx[2] && /*cell*/ ctx[0].value === /*highlightValue*/ ctx[2]
			? 'highlight'
			: ''}`) + " svelte-7kx00r"));

    			add_location(div, file$4, 126, 0, 2093);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*cell*/ ctx[0].value);
    			append_dev(div, t);
    			if (if_block) if_block.m(div, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(div, "click", /*cellClicked*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cell*/ 1 && input_disabled_value !== (input_disabled_value = /*cell*/ ctx[0].readonly)) {
    				prop_dev(input, "disabled", input_disabled_value);
    			}

    			if (dirty & /*cell*/ 1 && input.value !== /*cell*/ ctx[0].value) {
    				set_input_value(input, /*cell*/ ctx[0].value);
    			}

    			if (!/*cell*/ ctx[0].value) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*cell, activePosition, highlightValue*/ 7 && div_class_value !== (div_class_value = "" + (null_to_empty(`container
  ${/*cell*/ ctx[0].readonly ? 'readOnly' : 'notReadOnly'}
  ${/*cell*/ ctx[0].error ? 'hasError' : ''}
  ${/*cell*/ ctx[0].position === /*activePosition*/ ctx[1]
			? 'keyboardActive'
			: ''}
  ${/*highlightValue*/ ctx[2] && /*cell*/ ctx[0].value === /*highlightValue*/ ctx[2]
			? 'highlight'
			: ''}`) + " svelte-7kx00r"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Cell', slots, []);
    	let { cell } = $$props;
    	let { activePosition } = $$props;
    	let { highlightValue } = $$props;
    	const options = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    	const dispatch = createEventDispatcher();

    	const cellClicked = e => {
    		const element = e.currentTarget.querySelector("input");
    		element.focus();
    		dispatch("highlight", cell.value);
    		dispatch("change-navigation", cell.position);
    	};

    	const writable_props = ['cell', 'activePosition', 'highlightValue'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Cell> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		cell.value = this.value;
    		$$invalidate(0, cell);
    	}

    	$$self.$$set = $$props => {
    		if ('cell' in $$props) $$invalidate(0, cell = $$props.cell);
    		if ('activePosition' in $$props) $$invalidate(1, activePosition = $$props.activePosition);
    		if ('highlightValue' in $$props) $$invalidate(2, highlightValue = $$props.highlightValue);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		cell,
    		activePosition,
    		highlightValue,
    		options,
    		dispatch,
    		cellClicked
    	});

    	$$self.$inject_state = $$props => {
    		if ('cell' in $$props) $$invalidate(0, cell = $$props.cell);
    		if ('activePosition' in $$props) $$invalidate(1, activePosition = $$props.activePosition);
    		if ('highlightValue' in $$props) $$invalidate(2, highlightValue = $$props.highlightValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		cell,
    		activePosition,
    		highlightValue,
    		options,
    		cellClicked,
    		input_input_handler
    	];
    }

    class Cell extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			cell: 0,
    			activePosition: 1,
    			highlightValue: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cell",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*cell*/ ctx[0] === undefined && !('cell' in props)) {
    			console.warn("<Cell> was created without expected prop 'cell'");
    		}

    		if (/*activePosition*/ ctx[1] === undefined && !('activePosition' in props)) {
    			console.warn("<Cell> was created without expected prop 'activePosition'");
    		}

    		if (/*highlightValue*/ ctx[2] === undefined && !('highlightValue' in props)) {
    			console.warn("<Cell> was created without expected prop 'highlightValue'");
    		}
    	}

    	get cell() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cell(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activePosition() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activePosition(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get highlightValue() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set highlightValue(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const blocks2 = [Array(2).fill([1, 1, 2, 2]), Array(2).fill([3, 3, 4, 4])].flat(
      2
    );

    const blocks3 = [
      Array(3).fill([1, 1, 1, 2, 2, 2, 3, 3, 3]),
      Array(3).fill([4, 4, 4, 5, 5, 5, 6, 6, 6]),
      Array(3).fill([7, 7, 7, 8, 8, 8, 9, 9, 9])
    ].flat(2);

    const generateGrid = (blockSize = 3) => {
      const elements = blockSize === 3 ? 81 : 16;
      return Array(elements).fill(0)
    };

    const shuffle = a => {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]];
      }
      return a
    };

    const fillGrid = (grid, blockSize = 3) => {
      const gridSize = blockSize === 3 ? 9 : 4;

      const stack = [];
      let currentIndex = 0;
      let currentValue = grid[currentIndex];

      let numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      let numberIndex = 0;

      while (hasZeros(grid)) {
        if (currentValue === 0) {
          if (
            isLegal(grid, currentIndex, numbers[numberIndex], blockSize) &&
            numberIndex < gridSize
          ) {
            grid[currentIndex] = numbers[numberIndex];
            stack.push(currentIndex);
            numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
            numberIndex = -1;
            currentIndex = currentIndex + 1;
            currentValue = grid[currentIndex];
          } else if (numberIndex > gridSize - 1) {
            grid[currentIndex] = 0;
            currentIndex = stack.pop();
            numberIndex = numbers.indexOf(grid[currentIndex]);
            grid[currentIndex] = 0;
          }
        } else {
          currentIndex = currentIndex + 1;
          currentValue = grid[currentIndex];
          numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          numberIndex = -1;
        }
        numberIndex = numberIndex + 1;
      }
      return grid
    };

    const includeBlockInfo = (grid, blockSize = 3) => {
      const blocks = blockSize === 3 ? blocks3 : blocks2;

      return grid.map((cell, index) => ({
        value: cell,
        block: blocks[index],
        position: index,
        readonly: !!cell,
        pencil: new Set()
      }))
    };

    const groupByBlock = grid => {
      return grid.reduce((acc, cell) => {
        // The blocks starts at 1
        const block = cell.block - 1;

        if (acc[block]) {
          acc[block].push(cell);
        } else {
          acc[block] = [cell];
        }
        return acc
      }, [])
    };

    const numberOfCells = {
      easy: 62,
      medium: 53,
      hard: 44,
      veryHard: 35,
      insane: 26
    };

    const applyGameDifficult = (difficult, grid) => {
      const indexes = new Set();
      while (indexes.size !== 81 - numberOfCells[difficult]) {
        const randomIndex = Math.floor(Math.random() * 81);
        indexes.add(randomIndex);
      }
      for (const index of indexes) {
        grid[index] = null;
      }
      return grid
    };

    const isLegal = (grid, position, number, blockSize = 3) => {
      const usedNumbers = new Set();

      const gridSize = blockSize === 3 ? 9 : 4;
      const blocks = blockSize === 3 ? blocks3 : blocks2;

      // Row
      const row = Math.floor(position / gridSize);
      grid.forEach((cell, index) => {
        if (Math.floor(index / gridSize) === row) {
          usedNumbers.add(cell);
        }
      });

      // Column
      const column = position % gridSize;
      grid.forEach((cell, index) => {
        if (Math.floor(index % gridSize) === column) {
          usedNumbers.add(cell);
        }
      });

      // Block
      const block = blocks[position];
      grid.forEach((cell, index) => {
        if (blocks[index] === block) {
          usedNumbers.add(cell);
        }
      });

      return !usedNumbers.has(number)
    };

    const hasZeros = grid => {
      return grid.filter(item => item === 0).length !== 0
    };

    const getAvailableNumber = (restrictions, blockSize = 3) => {
      const gridSize = blockSize === 3 ? 9 : 4;
      let value = null;

      while (!value) {
        const number = Math.floor(Math.random() * gridSize) + 1;
        if (!restrictions.has(number)) {
          value = number;
        }
      }
      return value
    };

    const getErrors = grid => {
      return grid.filter(cell => cell.error).length
    };

    const getMissingValues = (grid, errors) => {
      return grid.filter(cell => cell.value === null).length + errors
    };

    const validateKeyInteraction = (key, position) => {
      const value = parseInt(key, 10);

      if (key === 'ArrowDown' && position < 72) {
        return [true, 'down']
      } else if (key === 'ArrowUp' && position > 8) {
        return [true, 'up']
      } else if (key === 'ArrowLeft' && position % 9 > 0) {
        return [true, 'left']
      } else if (key === 'ArrowRight' && position % 9 < 8) {
        return [true, 'right']
      } else if (Number.isInteger(value)) {
        return [true, 'digit']
      }

      return [false, null]
    };

    const getNewActivePosition = (position, action) => {
      if (action === 'down') {
        return position + 9
      } else if (action === 'up') {
        return position - 9
      } else if (action === 'left') {
        return position - 1
      } else if (action === 'right') {
        return position + 1
      }
    };

    var utils = /*#__PURE__*/Object.freeze({
        __proto__: null,
        generateGrid: generateGrid,
        fillGrid: fillGrid,
        includeBlockInfo: includeBlockInfo,
        groupByBlock: groupByBlock,
        applyGameDifficult: applyGameDifficult,
        isLegal: isLegal,
        hasZeros: hasZeros,
        getAvailableNumber: getAvailableNumber,
        getErrors: getErrors,
        getMissingValues: getMissingValues,
        validateKeyInteraction: validateKeyInteraction,
        getNewActivePosition: getNewActivePosition
    });

    /* src\Jogar.svelte generated by Svelte v3.44.3 */
    const file$3 = "src\\Jogar.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (121:8) {#each block as cell}
    function create_each_block_1(ctx) {
    	let div;
    	let cell;
    	let current;

    	cell = new Cell({
    			props: {
    				cell: /*cell*/ ctx[18],
    				activePosition: /*activePosition*/ ctx[1],
    				highlightValue: /*highlightValue*/ ctx[2]
    			},
    			$$inline: true
    		});

    	cell.$on("change-navigation", /*handleChangeNavigation*/ ctx[8]);
    	cell.$on("highlight", /*handleHighlight*/ ctx[9]);
    	cell.$on("pen", /*handlePen*/ ctx[5]);
    	cell.$on("pencil", /*handlePencil*/ ctx[6]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(cell.$$.fragment);
    			attr_dev(div, "class", "cell svelte-1j973lr");
    			add_location(div, file$3, 121, 10, 3178);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(cell, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const cell_changes = {};
    			if (dirty & /*groupedGrid*/ 16) cell_changes.cell = /*cell*/ ctx[18];
    			if (dirty & /*activePosition*/ 2) cell_changes.activePosition = /*activePosition*/ ctx[1];
    			if (dirty & /*highlightValue*/ 4) cell_changes.highlightValue = /*highlightValue*/ ctx[2];
    			cell.$set(cell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(cell);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(121:8) {#each block as cell}",
    		ctx
    	});

    	return block;
    }

    // (119:4) {#each groupedGrid as block}
    function create_each_block(ctx) {
    	let div;
    	let t;
    	let current;
    	let each_value_1 = /*block*/ ctx[15];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "block svelte-1j973lr");
    			add_location(div, file$3, 119, 6, 3118);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*groupedGrid, activePosition, highlightValue, handleChangeNavigation, handleHighlight, handlePen, handlePencil*/ 886) {
    				each_value_1 = /*block*/ ctx[15];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, t);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(119:4) {#each groupedGrid as block}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let link;
    	let t0;
    	let button;
    	let voltarmenu;
    	let t1;
    	let div1;
    	let info;
    	let t2;
    	let div0;
    	let current;
    	voltarmenu = new VoltarMenu({ $$inline: true });

    	info = new Info({
    			props: {
    				isVictory: /*isVictory*/ ctx[3],
    				selectedDifficult: /*selectedDifficult*/ ctx[0]
    			},
    			$$inline: true
    		});

    	info.$on("change-difficult", /*handleChangeDifficult*/ ctx[7]);
    	let each_value = /*groupedGrid*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			button = element("button");
    			create_component(voltarmenu.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			create_component(info.$$.fragment);
    			t2 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "/styles/jogar.css");
    			add_location(link, file$3, 1, 1, 15);
    			attr_dev(button, "class", "btn draw-border svelte-1j973lr");
    			add_location(button, file$3, 110, 0, 2879);
    			attr_dev(div0, "class", "grid svelte-1j973lr");
    			add_location(div0, file$3, 117, 2, 3060);
    			attr_dev(div1, "class", "container svelte-1j973lr");
    			add_location(div1, file$3, 112, 0, 2935);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    			mount_component(voltarmenu, button, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(info, div1, null);
    			append_dev(div1, t2);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const info_changes = {};
    			if (dirty & /*isVictory*/ 8) info_changes.isVictory = /*isVictory*/ ctx[3];
    			if (dirty & /*selectedDifficult*/ 1) info_changes.selectedDifficult = /*selectedDifficult*/ ctx[0];
    			info.$set(info_changes);

    			if (dirty & /*groupedGrid, activePosition, highlightValue, handleChangeNavigation, handleHighlight, handlePen, handlePencil*/ 886) {
    				each_value = /*groupedGrid*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(voltarmenu.$$.fragment, local);
    			transition_in(info.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(voltarmenu.$$.fragment, local);
    			transition_out(info.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			destroy_component(voltarmenu);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			destroy_component(info);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let groupedGrid;
    	let errors;
    	let missingValues;
    	let isVictory;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Jogar', slots, []);
    	let selectedDifficult = "hard";
    	let gridWithDifficult;
    	let gridWithBlockInfo;
    	let activePosition = 0;
    	let highlightValue = null;

    	const startGame = difficult => {
    		const grid = generateGrid(3);
    		const filledGrid = fillGrid(grid, 3);
    		gridWithDifficult = applyGameDifficult(selectedDifficult, filledGrid);
    		$$invalidate(10, gridWithBlockInfo = includeBlockInfo(gridWithDifficult, 3));
    	};

    	const handlePen = ({ detail: { value, position } }) => {
    		const isLegal$1 = isLegal(gridWithDifficult, position, value);

    		$$invalidate(10, gridWithBlockInfo = gridWithBlockInfo.map(cell => {
    			if (cell.position !== position) {
    				return cell;
    			}

    			return {
    				...cell,
    				value: value !== 0 ? value : null,
    				error: value === 0 ? false : !isLegal$1
    			};
    		}));

    		gridWithDifficult[position] = value;
    	};

    	const handlePencil = ({ detail: { value, position } }) => {
    		if (value === 0) return;

    		$$invalidate(10, gridWithBlockInfo = gridWithBlockInfo.map(cell => {
    			if (cell.position !== position) {
    				return cell;
    			}

    			const isAlreadyThere = cell.pencil.has(value);

    			if (isAlreadyThere) {
    				cell.pencil.delete(value);
    			} else {
    				cell.pencil.add(value);
    			}

    			return cell;
    		}));
    	};

    	const handleChangeDifficult = ({ detail }) => {
    		$$invalidate(0, selectedDifficult = detail);
    		startGame();
    	};

    	const handleChangeNavigation = ({ detail: value }) => {
    		$$invalidate(1, activePosition = value);
    	};

    	const handleHighlight = ({ detail: value }) => {
    		if (highlightValue === value) {
    			$$invalidate(2, highlightValue = null);
    		} else {
    			$$invalidate(2, highlightValue = value);
    		}
    	};

    	startGame();

    	window.addEventListener("keydown", e => {
    		e.preventDefault();
    		const { key, ctrlKey } = e;
    		const [isValid, action] = validateKeyInteraction(key, activePosition);
    		if (!isValid) return;

    		if (action !== "digit") {
    			$$invalidate(1, activePosition = getNewActivePosition(activePosition, action));
    		} else {
    			const cell = gridWithBlockInfo[activePosition];
    			if (cell.readonly) return;

    			const event = {
    				detail: {
    					value: parseInt(key, 10),
    					position: activePosition
    				}
    			};

    			ctrlKey ? handlePencil(event) : handlePen(event);
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Jogar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		VoltarMenu,
    		estado,
    		trocarEstadoDoJogo,
    		Info,
    		Cell,
    		utils,
    		selectedDifficult,
    		gridWithDifficult,
    		gridWithBlockInfo,
    		activePosition,
    		highlightValue,
    		startGame,
    		handlePen,
    		handlePencil,
    		handleChangeDifficult,
    		handleChangeNavigation,
    		handleHighlight,
    		missingValues,
    		isVictory,
    		errors,
    		groupedGrid
    	});

    	$$self.$inject_state = $$props => {
    		if ('selectedDifficult' in $$props) $$invalidate(0, selectedDifficult = $$props.selectedDifficult);
    		if ('gridWithDifficult' in $$props) gridWithDifficult = $$props.gridWithDifficult;
    		if ('gridWithBlockInfo' in $$props) $$invalidate(10, gridWithBlockInfo = $$props.gridWithBlockInfo);
    		if ('activePosition' in $$props) $$invalidate(1, activePosition = $$props.activePosition);
    		if ('highlightValue' in $$props) $$invalidate(2, highlightValue = $$props.highlightValue);
    		if ('missingValues' in $$props) $$invalidate(11, missingValues = $$props.missingValues);
    		if ('isVictory' in $$props) $$invalidate(3, isVictory = $$props.isVictory);
    		if ('errors' in $$props) $$invalidate(12, errors = $$props.errors);
    		if ('groupedGrid' in $$props) $$invalidate(4, groupedGrid = $$props.groupedGrid);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*gridWithBlockInfo*/ 1024) {
    			$$invalidate(4, groupedGrid = groupByBlock(gridWithBlockInfo));
    		}

    		if ($$self.$$.dirty & /*gridWithBlockInfo*/ 1024) {
    			$$invalidate(12, errors = getErrors(gridWithBlockInfo));
    		}

    		if ($$self.$$.dirty & /*gridWithBlockInfo, errors*/ 5120) {
    			$$invalidate(11, missingValues = getMissingValues(gridWithBlockInfo, errors));
    		}

    		if ($$self.$$.dirty & /*missingValues*/ 2048) {
    			$$invalidate(3, isVictory = missingValues === 0);
    		}
    	};

    	return [
    		selectedDifficult,
    		activePosition,
    		highlightValue,
    		isVictory,
    		groupedGrid,
    		handlePen,
    		handlePencil,
    		handleChangeDifficult,
    		handleChangeNavigation,
    		handleHighlight,
    		gridWithBlockInfo,
    		missingValues,
    		errors
    	];
    }

    class Jogar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jogar",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Sobre.svelte generated by Svelte v3.44.3 */
    const file$2 = "src\\Sobre.svelte";

    function create_fragment$3(ctx) {
    	let link;
    	let t0;
    	let div10;
    	let button;
    	let voltarmenu;
    	let t1;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t2;
    	let p0;
    	let t4;
    	let div0;
    	let t6;
    	let div3;
    	let img1;
    	let img1_src_value;
    	let t7;
    	let p1;
    	let t9;
    	let div2;
    	let t11;
    	let div6;
    	let img2;
    	let img2_src_value;
    	let t12;
    	let p2;
    	let t14;
    	let div4;
    	let t16;
    	let div5;
    	let t18;
    	let div9;
    	let img3;
    	let img3_src_value;
    	let t19;
    	let p3;
    	let t21;
    	let div7;
    	let t23;
    	let div8;
    	let current;
    	voltarmenu = new VoltarMenu({ $$inline: true });

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			div10 = element("div");
    			button = element("button");
    			create_component(voltarmenu.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			img0 = element("img");
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "Matheus Vinícius";
    			t4 = space();
    			div0 = element("div");
    			div0.textContent = "mvfs5@discente.ifpe.edu.br";
    			t6 = space();
    			div3 = element("div");
    			img1 = element("img");
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "Niedllin Araújo";
    			t9 = space();
    			div2 = element("div");
    			div2.textContent = "nfaa@discente.ifpe.edu.br";
    			t11 = space();
    			div6 = element("div");
    			img2 = element("img");
    			t12 = space();
    			p2 = element("p");
    			p2.textContent = "Allan Lima";
    			t14 = space();
    			div4 = element("div");
    			div4.textContent = "allan.lima@igarassu.ifpe.edu.br";
    			t16 = space();
    			div5 = element("div");
    			div5.textContent = "-- Referência de Projeto --";
    			t18 = space();
    			div9 = element("div");
    			img3 = element("img");
    			t19 = space();
    			p3 = element("p");
    			p3.textContent = "Vinicius Sabadim";
    			t21 = space();
    			div7 = element("div");
    			div7.textContent = "https://github.com/vinicius-sabadim";
    			t23 = space();
    			div8 = element("div");
    			div8.textContent = "-- Referência de Projeto --";
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "/styles/sobre.css");
    			add_location(link, file$2, 1, 1, 15);
    			attr_dev(button, "class", "btn draw-border svelte-5c53az");
    			add_location(button, file$2, 11, 1, 173);
    			if (!src_url_equal(img0.src, img0_src_value = "images/vini.jpg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Person");
    			attr_dev(img0, "class", "card__image svelte-5c53az");
    			add_location(img0, file$2, 14, 3, 253);
    			attr_dev(p0, "class", "card__name svelte-5c53az");
    			add_location(p0, file$2, 15, 3, 317);
    			attr_dev(div0, "class", "grid-container svelte-5c53az");
    			add_location(div0, file$2, 16, 3, 364);
    			attr_dev(div1, "class", "card svelte-5c53az");
    			add_location(div1, file$2, 13, 1, 231);
    			if (!src_url_equal(img1.src, img1_src_value = "https://avatars.githubusercontent.com/u/119949191?v=4")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Person");
    			attr_dev(img1, "class", "card__image svelte-5c53az");
    			add_location(img1, file$2, 21, 3, 465);
    			attr_dev(p1, "class", "card__name svelte-5c53az");
    			add_location(p1, file$2, 22, 3, 567);
    			attr_dev(div2, "class", "grid-container svelte-5c53az");
    			add_location(div2, file$2, 23, 3, 613);
    			attr_dev(div3, "class", "card svelte-5c53az");
    			add_location(div3, file$2, 20, 1, 443);
    			if (!src_url_equal(img2.src, img2_src_value = "images/logoIFPE.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Person");
    			attr_dev(img2, "class", "card__image svelte-5c53az");
    			add_location(img2, file$2, 28, 3, 713);
    			attr_dev(p2, "class", "card__name svelte-5c53az");
    			add_location(p2, file$2, 29, 3, 781);
    			attr_dev(div4, "class", "grid-container svelte-5c53az");
    			add_location(div4, file$2, 30, 3, 822);
    			attr_dev(div5, "class", "grid-container svelte-5c53az");
    			add_location(div5, file$2, 31, 5, 898);
    			attr_dev(div6, "class", "card svelte-5c53az");
    			add_location(div6, file$2, 27, 1, 691);
    			if (!src_url_equal(img3.src, img3_src_value = "https://avatars.githubusercontent.com/u/7515783?v=4")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Person");
    			attr_dev(img3, "class", "card__image svelte-5c53az");
    			add_location(img3, file$2, 35, 1, 996);
    			attr_dev(p3, "class", "card__name svelte-5c53az");
    			add_location(p3, file$2, 36, 1, 1094);
    			attr_dev(div7, "class", "grid-container svelte-5c53az");
    			add_location(div7, file$2, 37, 1, 1140);
    			attr_dev(div8, "class", "grid-container svelte-5c53az");
    			add_location(div8, file$2, 38, 4, 1219);
    			attr_dev(div9, "class", "card svelte-5c53az");
    			add_location(div9, file$2, 34, 2, 976);
    			attr_dev(div10, "class", "container svelte-5c53az");
    			add_location(div10, file$2, 9, 0, 147);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div10, anchor);
    			append_dev(div10, button);
    			mount_component(voltarmenu, button, null);
    			append_dev(div10, t1);
    			append_dev(div10, div1);
    			append_dev(div1, img0);
    			append_dev(div1, t2);
    			append_dev(div1, p0);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div10, t6);
    			append_dev(div10, div3);
    			append_dev(div3, img1);
    			append_dev(div3, t7);
    			append_dev(div3, p1);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div10, t11);
    			append_dev(div10, div6);
    			append_dev(div6, img2);
    			append_dev(div6, t12);
    			append_dev(div6, p2);
    			append_dev(div6, t14);
    			append_dev(div6, div4);
    			append_dev(div6, t16);
    			append_dev(div6, div5);
    			append_dev(div10, t18);
    			append_dev(div10, div9);
    			append_dev(div9, img3);
    			append_dev(div9, t19);
    			append_dev(div9, p3);
    			append_dev(div9, t21);
    			append_dev(div9, div7);
    			append_dev(div9, t23);
    			append_dev(div9, div8);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(voltarmenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(voltarmenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div10);
    			destroy_component(voltarmenu);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sobre', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sobre> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ VoltarMenu });
    	return [];
    }

    class Sobre extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sobre",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Menu.svelte generated by Svelte v3.44.3 */
    const file$1 = "src\\Menu.svelte";

    function create_fragment$2(ctx) {
    	let link;
    	let t0;
    	let body;
    	let h1;
    	let t2;
    	let nav;
    	let a0;
    	let t4;
    	let a1;
    	let t6;
    	let a2;
    	let t8;
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			body = element("body");
    			h1 = element("h1");
    			h1.textContent = "SUDOKU";
    			t2 = space();
    			nav = element("nav");
    			a0 = element("a");
    			a0.textContent = "JOGAR";
    			t4 = space();
    			a1 = element("a");
    			a1.textContent = "DICAS";
    			t6 = space();
    			a2 = element("a");
    			a2.textContent = "SOBRE";
    			t8 = space();
    			div = element("div");
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "/styles/menu.css");
    			attr_dev(link, "class", "svelte-xxqqh7");
    			add_location(link, file$1, 1, 1, 15);
    			attr_dev(h1, "class", "svelte-xxqqh7");
    			add_location(h1, file$1, 12, 1, 197);
    			attr_dev(a0, "class", "menu svelte-xxqqh7");
    			add_location(a0, file$1, 14, 3, 239);
    			attr_dev(a1, "class", "menu svelte-xxqqh7");
    			add_location(a1, file$1, 15, 3, 313);
    			attr_dev(a2, "class", "menu svelte-xxqqh7");
    			add_location(a2, file$1, 16, 3, 387);
    			attr_dev(div, "class", "dot svelte-xxqqh7");
    			add_location(div, file$1, 17, 3, 461);
    			attr_dev(nav, "class", "navMenu svelte-xxqqh7");
    			add_location(nav, file$1, 13, 1, 214);
    			attr_dev(body, "class", "svelte-xxqqh7");
    			add_location(body, file$1, 11, 0, 189);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, body, anchor);
    			append_dev(body, h1);
    			append_dev(body, t2);
    			append_dev(body, nav);
    			append_dev(nav, a0);
    			append_dev(nav, t4);
    			append_dev(nav, a1);
    			append_dev(nav, t6);
    			append_dev(nav, a2);
    			append_dev(nav, t8);
    			append_dev(nav, div);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a0, "click", /*click_handler*/ ctx[0], false, false, false),
    					listen_dev(a1, "click", /*click_handler_1*/ ctx[1], false, false, false),
    					listen_dev(a2, "click", /*click_handler_2*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(body);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Menu', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Menu> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => trocarEstadoDoJogo('jogar');
    	const click_handler_1 = () => trocarEstadoDoJogo('ajuda');
    	const click_handler_2 = () => trocarEstadoDoJogo('sobre');
    	$$self.$capture_state = () => ({ estado, trocarEstadoDoJogo });
    	return [click_handler, click_handler_1, click_handler_2];
    }

    class Menu extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Menu",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Ajuda.svelte generated by Svelte v3.44.3 */
    const file = "src\\Ajuda.svelte";

    function create_fragment$1(ctx) {
    	let link;
    	let t0;
    	let button;
    	let voltarmenu;
    	let t1;
    	let body;
    	let div1;
    	let div0;
    	let t2;
    	let br0;
    	let t3;
    	let br1;
    	let t4;
    	let br2;
    	let t5;
    	let br3;
    	let t6;
    	let current;
    	voltarmenu = new VoltarMenu({ $$inline: true });

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			button = element("button");
    			create_component(voltarmenu.$$.fragment);
    			t1 = space();
    			body = element("body");
    			div1 = element("div");
    			div0 = element("div");
    			t2 = text("SUDOKU é um jogo de raciocínio e lógica.");
    			br0 = element("br");
    			t3 = text("O objetivo do jogo é completar todos os quadrados utilizando números de 1 a 9.");
    			br1 = element("br");
    			t4 = text("Para completá-los basta seguir a seguinte regra:");
    			br2 = element("br");
    			t5 = text("Não podem haver números repetidos nas linhas horizontais e verticais");
    			br3 = element("br");
    			t6 = text("assim como nos quadrados delimitados por linhas em negrito.");
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "/styles/ajuda.css");
    			add_location(link, file, 1, 1, 16);
    			attr_dev(button, "class", "btn draw-border svelte-1sxe304");
    			add_location(button, file, 8, 0, 154);
    			add_location(br0, file, 11, 94, 314);
    			add_location(br1, file, 11, 176, 396);
    			add_location(br2, file, 11, 228, 448);
    			add_location(br3, file, 11, 300, 520);
    			attr_dev(div0, "class", "module svelte-1sxe304");
    			add_location(div0, file, 11, 34, 254);
    			attr_dev(div1, "class", "module-border-wrap svelte-1sxe304");
    			add_location(div1, file, 11, 2, 222);
    			attr_dev(body, "class", "svelte-1sxe304");
    			add_location(body, file, 10, 0, 212);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, button, anchor);
    			mount_component(voltarmenu, button, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, body, anchor);
    			append_dev(body, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    			append_dev(div0, br0);
    			append_dev(div0, t3);
    			append_dev(div0, br1);
    			append_dev(div0, t4);
    			append_dev(div0, br2);
    			append_dev(div0, t5);
    			append_dev(div0, br3);
    			append_dev(div0, t6);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(voltarmenu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(voltarmenu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(button);
    			destroy_component(voltarmenu);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(body);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Ajuda', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Ajuda> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ VoltarMenu });
    	return [];
    }

    class Ajuda extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Ajuda",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.3 */

    // (28:30) 
    function create_if_block_3(ctx) {
    	let jogo;
    	let current;
    	jogo = new Jogar({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(jogo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(jogo, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(jogo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(jogo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(jogo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(28:30) ",
    		ctx
    	});

    	return block;
    }

    // (26:30) 
    function create_if_block_2(ctx) {
    	let ajuda;
    	let current;
    	ajuda = new Ajuda({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(ajuda.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(ajuda, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(ajuda.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(ajuda.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(ajuda, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(26:30) ",
    		ctx
    	});

    	return block;
    }

    // (24:30) 
    function create_if_block_1(ctx) {
    	let sobre;
    	let current;
    	sobre = new Sobre({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(sobre.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sobre, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sobre.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sobre.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sobre, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(24:30) ",
    		ctx
    	});

    	return block;
    }

    // (21:0) {#if $estado === 'menu'}
    function create_if_block(ctx) {
    	let menu;
    	let current;
    	menu = new Menu({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(menu.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(menu, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(menu.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(menu.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(menu, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(21:0) {#if $estado === 'menu'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$estado*/ ctx[0] === 'menu') return 0;
    		if (/*$estado*/ ctx[0] === 'sobre') return 1;
    		if (/*$estado*/ ctx[0] === 'ajuda') return 2;
    		if (/*$estado*/ ctx[0] === 'jogar') return 3;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $estado;
    	validate_store(estado, 'estado');
    	component_subscribe($$self, estado, $$value => $$invalidate(0, $estado = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Jogo: Jogar,
    		Sobre,
    		Menu,
    		Ajuda,
    		estado,
    		$estado
    	});

    	return [$estado];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
