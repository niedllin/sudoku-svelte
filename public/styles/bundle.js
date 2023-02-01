
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
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
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function createEventDispatcher() {
        const component = current_component;
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
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.shift()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            while (render_callbacks.length) {
                const callback = render_callbacks.pop();
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_render);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_render.forEach(add_render_callback);
        }
    }
    let outros;
    function group_outros() {
        outros = {
            remaining: 0,
            callbacks: []
        };
    }
    function check_outros() {
        if (!outros.remaining) {
            run_all(outros.callbacks);
        }
    }
    function on_outro(callback) {
        outros.callbacks.push(callback);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_render } = component.$$;
        fragment.m(target, anchor);
        // onMount happens after the initial afterUpdate. Because
        // afterUpdate callbacks happen in reverse order (inner first)
        // we schedule onMount callbacks before afterUpdate callbacks
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
        after_render.forEach(add_render_callback);
    }
    function destroy(component, detaching) {
        if (component.$$) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal$$1, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal: not_equal$$1,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_render: [],
            after_render: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal$$1($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_render);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro && component.$$.fragment.i)
                component.$$.fragment.i();
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy(this, true);
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
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\Info.svelte generated by Svelte v3.5.1 */

    const file = "src\\Info.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.level = list[i];
    	return child_ctx;
    }

    // (91:4) {#each levels as level}
    function create_each_block(ctx) {
    	var li, t_value = ctx.levelText[ctx.level], t, li_class_value, dispose;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	return {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			li.className = li_class_value = "" + (ctx.level === ctx.selectedDifficult ? 'active' : '') + " svelte-k3hw74";
    			add_location(li, file, 91, 6, 1516);
    			dispose = listen(li, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t);
    		},

    		p: function update(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.selectedDifficult) && li_class_value !== (li_class_value = "" + (ctx.level === ctx.selectedDifficult ? 'active' : '') + " svelte-k3hw74")) {
    				li.className = li_class_value;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}

    			dispose();
    		}
    	};
    }

    // (110:2) {#if isVictory}
    function create_if_block(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Victory :)";
    			p.className = "victory svelte-k3hw74";
    			add_location(p, file, 110, 4, 1998);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div1, h1, t1, ul0, t2, div0, h2, t4, ul1, li0, t6, li1, t8, li2, t10, li3, t12;

    	var each_value = ctx.levels;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	var if_block = (ctx.isVictory) && create_if_block();

    	return {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Change level";
    			t1 = space();
    			ul0 = element("ul");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Hints";
    			t4 = space();
    			ul1 = element("ul");
    			li0 = element("li");
    			li0.textContent = "Click on a cell to highlight the same values.";
    			t6 = space();
    			li1 = element("li");
    			li1.textContent = "Arrow keys navigate through the cells.";
    			t8 = space();
    			li2 = element("li");
    			li2.textContent = "Number 0 erase a cell.";
    			t10 = space();
    			li3 = element("li");
    			li3.textContent = "Ctrl + number fill a cell using a pencil.";
    			t12 = space();
    			if (if_block) if_block.c();
    			h1.className = "svelte-k3hw74";
    			add_location(h1, file, 88, 2, 1434);
    			ul0.className = "level-menu svelte-k3hw74";
    			add_location(ul0, file, 89, 2, 1458);
    			h2.className = "svelte-k3hw74";
    			add_location(h2, file, 100, 4, 1722);
    			li0.className = "svelte-k3hw74";
    			add_location(li0, file, 102, 6, 1752);
    			li1.className = "svelte-k3hw74";
    			add_location(li1, file, 103, 6, 1813);
    			li2.className = "svelte-k3hw74";
    			add_location(li2, file, 104, 6, 1867);
    			li3.className = "svelte-k3hw74";
    			add_location(li3, file, 105, 6, 1905);
    			add_location(ul1, file, 101, 4, 1741);
    			div0.className = "hint-container svelte-k3hw74";
    			add_location(div0, file, 99, 2, 1689);
    			div1.className = "container svelte-k3hw74";
    			add_location(div1, file, 87, 0, 1408);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, h1);
    			append(div1, t1);
    			append(div1, ul0);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul0, null);
    			}

    			append(div1, t2);
    			append(div1, div0);
    			append(div0, h2);
    			append(div0, t4);
    			append(div0, ul1);
    			append(ul1, li0);
    			append(ul1, t6);
    			append(ul1, li1);
    			append(ul1, t8);
    			append(ul1, li2);
    			append(ul1, t10);
    			append(ul1, li3);
    			append(div1, t12);
    			if (if_block) if_block.m(div1, null);
    		},

    		p: function update(changed, ctx) {
    			if (changed.levels || changed.selectedDifficult || changed.levelText) {
    				each_value = ctx.levels;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}

    			if (ctx.isVictory) {
    				if (!if_block) {
    					if_block = create_if_block();
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			destroy_each(each_blocks, detaching);

    			if (if_block) if_block.d();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { isVictory, selectedDifficult } = $$props;

      const dispatch = createEventDispatcher();
      const handleChange = difficult => {
        dispatch("change-difficult", difficult);
      };

      const levels = ["easy", "medium", "hard", "veryHard", "insane"];
      const levelText = {
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        veryHard: "Very hard",
        insane: "Insane"
      };

    	const writable_props = ['isVictory', 'selectedDifficult'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Info> was created with unknown prop '${key}'`);
    	});

    	function click_handler({ level }) {
    		return handleChange(level);
    	}

    	$$self.$set = $$props => {
    		if ('isVictory' in $$props) $$invalidate('isVictory', isVictory = $$props.isVictory);
    		if ('selectedDifficult' in $$props) $$invalidate('selectedDifficult', selectedDifficult = $$props.selectedDifficult);
    	};

    	return {
    		isVictory,
    		selectedDifficult,
    		handleChange,
    		levels,
    		levelText,
    		click_handler
    	};
    }

    class Info extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["isVictory", "selectedDifficult"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.isVictory === undefined && !('isVictory' in props)) {
    			console.warn("<Info> was created without expected prop 'isVictory'");
    		}
    		if (ctx.selectedDifficult === undefined && !('selectedDifficult' in props)) {
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

    /* src\Cell.svelte generated by Svelte v3.5.1 */

    const file$1 = "src\\Cell.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.option = list[i];
    	return child_ctx;
    }

    // (135:2) {#if !cell.value}
    function create_if_block$1(ctx) {
    	var ul;

    	var each_value = ctx.options;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			ul = element("ul");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			ul.className = "pencil-container svelte-17nr28p";
    			add_location(ul, file$1, 135, 4, 2417);
    		},

    		m: function mount(target, anchor) {
    			insert(target, ul, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},

    		p: function update(changed, ctx) {
    			if (changed.options || changed.cell) {
    				each_value = ctx.options;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
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
    			if (detaching) {
    				detach(ul);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (137:6) {#each options as option}
    function create_each_block$1(ctx) {
    	var li, t0_value = ctx.option, t0, t1, li_class_value;

    	return {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			li.className = li_class_value = "" + (`option option${ctx.option} ${ctx.cell.pencil.has(ctx.option) ? 'visibleOption' : ''}`) + " svelte-17nr28p";
    			add_location(li, file$1, 137, 8, 2487);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t0);
    			append(li, t1);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.cell) && li_class_value !== (li_class_value = "" + (`option option${ctx.option} ${ctx.cell.pencil.has(ctx.option) ? 'visibleOption' : ''}`) + " svelte-17nr28p")) {
    				li.className = li_class_value;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var div, input, input_disabled_value, t, div_class_value, dispose;

    	var if_block = (!ctx.cell.value) && create_if_block$1(ctx);

    	return {
    		c: function create() {
    			div = element("div");
    			input = element("input");
    			t = space();
    			if (if_block) if_block.c();
    			input.disabled = input_disabled_value = ctx.cell.readonly;
    			attr(input, "type", "text");
    			input.className = "svelte-17nr28p";
    			add_location(input, file$1, 133, 2, 2322);
    			div.className = div_class_value = "" + (`container
  ${ctx.cell.readonly ? 'readOnly' : 'notReadOnly'}
  ${ctx.cell.error ? 'hasError' : ''}
  ${ctx.cell.position === ctx.activePosition ? 'keyboardActive' : ''}
  ${ctx.highlightValue && ctx.cell.value === ctx.highlightValue ? 'highlight' : ''}`) + " svelte-17nr28p";
    			add_location(div, file$1, 126, 0, 2051);

    			dispose = [
    				listen(input, "input", ctx.input_input_handler),
    				listen(div, "click", ctx.cellClicked)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, input);

    			input.value = ctx.cell.value;

    			append(div, t);
    			if (if_block) if_block.m(div, null);
    		},

    		p: function update(changed, ctx) {
    			if (changed.cell && (input.value !== ctx.cell.value)) input.value = ctx.cell.value;

    			if ((changed.cell) && input_disabled_value !== (input_disabled_value = ctx.cell.readonly)) {
    				input.disabled = input_disabled_value;
    			}

    			if (!ctx.cell.value) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((changed.cell || changed.activePosition || changed.highlightValue) && div_class_value !== (div_class_value = "" + (`container
  ${ctx.cell.readonly ? 'readOnly' : 'notReadOnly'}
  ${ctx.cell.error ? 'hasError' : ''}
  ${ctx.cell.position === ctx.activePosition ? 'keyboardActive' : ''}
  ${ctx.highlightValue && ctx.cell.value === ctx.highlightValue ? 'highlight' : ''}`) + " svelte-17nr28p")) {
    				div.className = div_class_value;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { cell, activePosition, highlightValue } = $$props;

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
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Cell> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		cell.value = this.value;
    		$$invalidate('cell', cell);
    	}

    	$$self.$set = $$props => {
    		if ('cell' in $$props) $$invalidate('cell', cell = $$props.cell);
    		if ('activePosition' in $$props) $$invalidate('activePosition', activePosition = $$props.activePosition);
    		if ('highlightValue' in $$props) $$invalidate('highlightValue', highlightValue = $$props.highlightValue);
    	};

    	return {
    		cell,
    		activePosition,
    		highlightValue,
    		options,
    		cellClicked,
    		input_input_handler
    	};
    }

    class Cell extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["cell", "activePosition", "highlightValue"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.cell === undefined && !('cell' in props)) {
    			console.warn("<Cell> was created without expected prop 'cell'");
    		}
    		if (ctx.activePosition === undefined && !('activePosition' in props)) {
    			console.warn("<Cell> was created without expected prop 'activePosition'");
    		}
    		if (ctx.highlightValue === undefined && !('highlightValue' in props)) {
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
      easy: 45,
      medium: 30,
      hard: 20,
      veryHard: 15,
      insane: 10
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

    /* src\App.svelte generated by Svelte v3.5.1 */

    const file$2 = "src\\App.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.cell = list[i];
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.block = list[i];
    	return child_ctx;
    }

    // (143:8) {#each block as cell}
    function create_each_block_1(ctx) {
    	var div, current;

    	var cell = new Cell({
    		props: {
    		cell: ctx.cell,
    		activePosition: ctx.activePosition,
    		highlightValue: ctx.highlightValue
    	},
    		$$inline: true
    	});
    	cell.$on("change-navigation", ctx.handleChangeNavigation);
    	cell.$on("highlight", ctx.handleHighlight);
    	cell.$on("pen", ctx.handlePen);
    	cell.$on("pencil", ctx.handlePencil);

    	return {
    		c: function create() {
    			div = element("div");
    			cell.$$.fragment.c();
    			div.className = "cell svelte-raq76k";
    			add_location(div, file$2, 143, 10, 3501);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(cell, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var cell_changes = {};
    			if (changed.groupedGrid) cell_changes.cell = ctx.cell;
    			if (changed.activePosition) cell_changes.activePosition = ctx.activePosition;
    			if (changed.highlightValue) cell_changes.highlightValue = ctx.highlightValue;
    			cell.$set(cell_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			cell.$$.fragment.i(local);

    			current = true;
    		},

    		o: function outro(local) {
    			cell.$$.fragment.o(local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			cell.$destroy();
    		}
    	};
    }

    // (141:4) {#each groupedGrid as block}
    function create_each_block$2(ctx) {
    	var div, t, current;

    	var each_value_1 = ctx.block;

    	var each_blocks = [];

    	for (var i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	function outro_block(i, detaching, local) {
    		if (each_blocks[i]) {
    			if (detaching) {
    				on_outro(() => {
    					each_blocks[i].d(detaching);
    					each_blocks[i] = null;
    				});
    			}

    			each_blocks[i].o(local);
    		}
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			div.className = "block svelte-raq76k";
    			add_location(div, file$2, 141, 6, 3441);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append(div, t);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.groupedGrid || changed.activePosition || changed.highlightValue || changed.handleChangeNavigation || changed.handleHighlight || changed.handlePen || changed.handlePencil) {
    				each_value_1 = ctx.block;

    				for (var i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						each_blocks[i].i(1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].i(1);
    						each_blocks[i].m(div, t);
    					}
    				}

    				group_outros();
    				for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value_1.length; i += 1) each_blocks[i].i();

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0, 0);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var div1, t, div0, current;

    	var info = new Info({
    		props: {
    		isVictory: ctx.isVictory,
    		selectedDifficult: ctx.selectedDifficult
    	},
    		$$inline: true
    	});
    	info.$on("change-difficult", ctx.handleChangeDifficult);

    	var each_value = ctx.groupedGrid;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	function outro_block(i, detaching, local) {
    		if (each_blocks[i]) {
    			if (detaching) {
    				on_outro(() => {
    					each_blocks[i].d(detaching);
    					each_blocks[i] = null;
    				});
    			}

    			each_blocks[i].o(local);
    		}
    	}

    	return {
    		c: function create() {
    			div1 = element("div");
    			info.$$.fragment.c();
    			t = space();
    			div0 = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			div0.className = "grid svelte-raq76k";
    			add_location(div0, file$2, 139, 2, 3383);
    			div1.className = "container svelte-raq76k";
    			add_location(div1, file$2, 134, 0, 3258);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			mount_component(info, div1, null);
    			append(div1, t);
    			append(div1, div0);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var info_changes = {};
    			if (changed.isVictory) info_changes.isVictory = ctx.isVictory;
    			if (changed.selectedDifficult) info_changes.selectedDifficult = ctx.selectedDifficult;
    			info.$set(info_changes);

    			if (changed.groupedGrid || changed.activePosition || changed.highlightValue || changed.handleChangeNavigation || changed.handleHighlight || changed.handlePen || changed.handlePencil) {
    				each_value = ctx.groupedGrid;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						each_blocks[i].i(1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].i(1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();
    				for (; i < each_blocks.length; i += 1) outro_block(i, 1, 1);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			info.$$.fragment.i(local);

    			for (var i = 0; i < each_value.length; i += 1) each_blocks[i].i();

    			current = true;
    		},

    		o: function outro(local) {
    			info.$$.fragment.o(local);

    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) outro_block(i, 0, 0);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			info.$destroy();

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

      let selectedDifficult = "hard";
      let gridWithDifficult;
      let gridWithBlockInfo;
      let activePosition = 0;
      let highlightValue = null;

      const startGame = difficult => {
        const grid = generateGrid(3);
        const filledGrid = fillGrid(grid, 3);
        gridWithDifficult = applyGameDifficult(selectedDifficult, filledGrid);
        $$invalidate('gridWithBlockInfo', gridWithBlockInfo = includeBlockInfo(gridWithDifficult, 3));
      };

      const handlePen = ({ detail: { value, position } }) => {
        const isLegal$1 = isLegal(gridWithDifficult, position, value);
        $$invalidate('gridWithBlockInfo', gridWithBlockInfo = gridWithBlockInfo.map(cell => {
          if (cell.position !== position) {
            return cell;
          }

          return {
            ...cell,
            value: value !== 0 ? value : null,
            error: value === 0 ? false : !isLegal$1
          };
        }));
        gridWithDifficult[position] = value;  };

      const handlePencil = ({ detail: { value, position } }) => {
        if (value === 0) return;

        $$invalidate('gridWithBlockInfo', gridWithBlockInfo = gridWithBlockInfo.map(cell => {
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
        $$invalidate('selectedDifficult', selectedDifficult = detail);
        startGame();
      };

      const handleChangeNavigation = ({ detail: value }) => {
        $$invalidate('activePosition', activePosition = value);
      };

      const handleHighlight = ({ detail: value }) => {
        if (highlightValue === value) {
          $$invalidate('highlightValue', highlightValue = null);
        } else {
          $$invalidate('highlightValue', highlightValue = value);
        }
      };

      startGame();

      window.addEventListener("keydown", e => {
        e.preventDefault();
        const { key, ctrlKey } = e;

        const [isValid, action] = validateKeyInteraction(key, activePosition);
        if (!isValid) return;

        if (action !== "digit") {
          $$invalidate('activePosition', activePosition = getNewActivePosition(activePosition, action));
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

    	let groupedGrid, errors, missingValues, isVictory;

    	$$self.$$.update = ($$dirty = { gridWithBlockInfo: 1, errors: 1, missingValues: 1 }) => {
    		if ($$dirty.gridWithBlockInfo) { $$invalidate('groupedGrid', groupedGrid = groupByBlock(gridWithBlockInfo)); }
    		if ($$dirty.gridWithBlockInfo) { $$invalidate('errors', errors = getErrors(gridWithBlockInfo)); }
    		if ($$dirty.gridWithBlockInfo || $$dirty.errors) { $$invalidate('missingValues', missingValues = getMissingValues(gridWithBlockInfo, errors)); }
    		if ($$dirty.missingValues) { $$invalidate('isVictory', isVictory = missingValues === 0); }
    	};

    	return {
    		selectedDifficult,
    		activePosition,
    		highlightValue,
    		handlePen,
    		handlePencil,
    		handleChangeDifficult,
    		handleChangeNavigation,
    		handleHighlight,
    		groupedGrid,
    		isVictory
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
