
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
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
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
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
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, changed, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(changed, child_ctx);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
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
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
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
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
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
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
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

    /* src/ContactCard.svelte generated by Svelte v3.12.1 */

    const file = "src/ContactCard.svelte";

    function create_fragment(ctx) {
    	var div2, div0, img, t0, div1, h1, t1, t2, t3, t4, h2, t5, t6, p, t7;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			t1 = text(ctx.userName);
    			t2 = text(" / ");
    			t3 = text(ctx.initialName);
    			t4 = space();
    			h2 = element("h2");
    			t5 = text(ctx.jobTitle);
    			t6 = space();
    			p = element("p");
    			t7 = text(ctx.description);
    			attr_dev(img, "class", "card-img-top");
    			attr_dev(img, "src", ctx.userImage);
    			attr_dev(img, "alt", ctx.userName);
    			add_location(img, file, 15, 4, 255);
    			attr_dev(div0, "class", "text-center w-25");
    			add_location(div0, file, 14, 2, 220);
    			attr_dev(h1, "class", "card-title");
    			add_location(h1, file, 18, 4, 354);
    			attr_dev(h2, "class", "card-title");
    			add_location(h2, file, 19, 4, 413);
    			attr_dev(p, "class", "card-text");
    			add_location(p, file, 20, 4, 456);
    			attr_dev(div1, "class", "card-body");
    			add_location(div1, file, 17, 2, 326);
    			attr_dev(div2, "class", "card text-white bg-dark p-2 w-50 my-4");
    			add_location(div2, file, 13, 0, 166);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			append_dev(h1, t1);
    			append_dev(h1, t2);
    			append_dev(h1, t3);
    			append_dev(div1, t4);
    			append_dev(div1, h2);
    			append_dev(h2, t5);
    			append_dev(div1, t6);
    			append_dev(div1, p);
    			append_dev(p, t7);
    		},

    		p: function update(changed, ctx) {
    			if (changed.userImage) {
    				attr_dev(img, "src", ctx.userImage);
    			}

    			if (changed.userName) {
    				attr_dev(img, "alt", ctx.userName);
    				set_data_dev(t1, ctx.userName);
    			}

    			if (changed.jobTitle) {
    				set_data_dev(t5, ctx.jobTitle);
    			}

    			if (changed.description) {
    				set_data_dev(t7, ctx.description);
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div2);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { userName, jobTitle, description, userImage } = $$props;

      let initialName = userName;

    	const writable_props = ['userName', 'jobTitle', 'description', 'userImage'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<ContactCard> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('userName' in $$props) $$invalidate('userName', userName = $$props.userName);
    		if ('jobTitle' in $$props) $$invalidate('jobTitle', jobTitle = $$props.jobTitle);
    		if ('description' in $$props) $$invalidate('description', description = $$props.description);
    		if ('userImage' in $$props) $$invalidate('userImage', userImage = $$props.userImage);
    	};

    	$$self.$capture_state = () => {
    		return { userName, jobTitle, description, userImage, initialName };
    	};

    	$$self.$inject_state = $$props => {
    		if ('userName' in $$props) $$invalidate('userName', userName = $$props.userName);
    		if ('jobTitle' in $$props) $$invalidate('jobTitle', jobTitle = $$props.jobTitle);
    		if ('description' in $$props) $$invalidate('description', description = $$props.description);
    		if ('userImage' in $$props) $$invalidate('userImage', userImage = $$props.userImage);
    		if ('initialName' in $$props) $$invalidate('initialName', initialName = $$props.initialName);
    	};

    	return {
    		userName,
    		jobTitle,
    		description,
    		userImage,
    		initialName
    	};
    }

    class ContactCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["userName", "jobTitle", "description", "userImage"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "ContactCard", options, id: create_fragment.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.userName === undefined && !('userName' in props)) {
    			console.warn("<ContactCard> was created without expected prop 'userName'");
    		}
    		if (ctx.jobTitle === undefined && !('jobTitle' in props)) {
    			console.warn("<ContactCard> was created without expected prop 'jobTitle'");
    		}
    		if (ctx.description === undefined && !('description' in props)) {
    			console.warn("<ContactCard> was created without expected prop 'description'");
    		}
    		if (ctx.userImage === undefined && !('userImage' in props)) {
    			console.warn("<ContactCard> was created without expected prop 'userImage'");
    		}
    	}

    	get userName() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userName(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get jobTitle() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set jobTitle(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get description() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set description(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get userImage() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set userImage(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.12.1 */

    const file$1 = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.contact = list[i];
    	child_ctx.index = i;
    	return child_ctx;
    }

    // (104:2) {:else}
    function create_else_block_1(ctx) {
    	var p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Please fill out the form and hit add.";
    			add_location(p, file$1, 104, 4, 2433);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block_1.name, type: "else", source: "(104:2) {:else}", ctx });
    	return block;
    }

    // (102:2) {#if formState === 'invalid'}
    function create_if_block(ctx) {
    	var p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Invalid Input";
    			add_location(p, file$1, 102, 4, 2398);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(102:2) {#if formState === 'invalid'}", ctx });
    	return block;
    }

    // (115:2) {:else}
    function create_else_block(ctx) {
    	var p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Please start by adding a contact.";
    			add_location(p, file$1, 115, 4, 2732);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(p);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_else_block.name, type: "else", source: "(115:2) {:else}", ctx });
    	return block;
    }

    // (108:2) {#each createdContacts as contact, index (contact.id)}
    function create_each_block(key_1, ctx) {
    	var h2, t0, t1_value = ctx.index + "", t1, t2, current;

    	var contactcard = new ContactCard({
    		props: {
    		userName: ctx.contact.name,
    		jobTitle: ctx.contact.jobTitle,
    		description: ctx.contact.desc,
    		userImage: ctx.contact.imageUrl
    	},
    		$$inline: true
    	});

    	const block = {
    		key: key_1,

    		first: null,

    		c: function create() {
    			h2 = element("h2");
    			t0 = text("#");
    			t1 = text(t1_value);
    			t2 = space();
    			contactcard.$$.fragment.c();
    			add_location(h2, file$1, 108, 4, 2548);
    			this.first = h2;
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			insert_dev(target, t2, anchor);
    			mount_component(contactcard, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.createdContacts) && t1_value !== (t1_value = ctx.index + "")) {
    				set_data_dev(t1, t1_value);
    			}

    			var contactcard_changes = {};
    			if (changed.createdContacts) contactcard_changes.userName = ctx.contact.name;
    			if (changed.createdContacts) contactcard_changes.jobTitle = ctx.contact.jobTitle;
    			if (changed.createdContacts) contactcard_changes.description = ctx.contact.desc;
    			if (changed.createdContacts) contactcard_changes.userImage = ctx.contact.imageUrl;
    			contactcard.$set(contactcard_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(contactcard.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(contactcard.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(h2);
    				detach_dev(t2);
    			}

    			destroy_component(contactcard, detaching);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(108:2) {#each createdContacts as contact, index (contact.id)}", ctx });
    	return block;
    }

    function create_fragment$1(ctx) {
    	var div5, form, div4, div0, label0, t1, input0, t2, div1, label1, t4, input1, t5, div2, label2, t7, input2, t8, div3, label3, t10, textarea, t11, button0, t13, button1, t15, button2, t17, button3, t19, t20, each_blocks = [], each_1_lookup = new Map(), current, dispose;

    	function select_block_type(changed, ctx) {
    		if (ctx.formState === 'invalid') return create_if_block;
    		return create_else_block_1;
    	}

    	var current_block_type = select_block_type(null, ctx);
    	var if_block = current_block_type(ctx);

    	let each_value = ctx.createdContacts;

    	const get_key = ctx => ctx.contact.id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block(ctx);
    		each_1_else.c();
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			form = element("form");
    			div4 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "User Name";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Job Title";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Image URL";
    			t7 = space();
    			input2 = element("input");
    			t8 = space();
    			div3 = element("div");
    			label3 = element("label");
    			label3.textContent = "Description";
    			t10 = space();
    			textarea = element("textarea");
    			t11 = space();
    			button0 = element("button");
    			button0.textContent = "Add Contact Card";
    			t13 = space();
    			button1 = element("button");
    			button1.textContent = "Clear";
    			t15 = space();
    			button2 = element("button");
    			button2.textContent = "Delete First";
    			t17 = space();
    			button3 = element("button");
    			button3.textContent = "Delete Last";
    			t19 = space();
    			if_block.c();
    			t20 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(label0, "for", "userName");
    			attr_dev(label0, "class", "mr-3");
    			add_location(label0, file$1, 58, 8, 1088);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "userName");
    			add_location(input0, file$1, 59, 8, 1149);
    			attr_dev(div0, "class", "input-group mb-3 w-50");
    			add_location(div0, file$1, 57, 6, 1044);
    			attr_dev(label1, "for", "jobTitle");
    			attr_dev(label1, "class", "mr-3");
    			add_location(label1, file$1, 66, 8, 1327);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "jobTitle");
    			add_location(input1, file$1, 67, 8, 1388);
    			attr_dev(div1, "class", "input-group mb-3 w-50");
    			add_location(div1, file$1, 65, 6, 1283);
    			attr_dev(label2, "for", "image");
    			attr_dev(label2, "class", "mr-3");
    			add_location(label2, file$1, 74, 8, 1567);
    			attr_dev(input2, "type", "text");
    			attr_dev(input2, "class", "form-control");
    			attr_dev(input2, "id", "image");
    			add_location(input2, file$1, 75, 8, 1625);
    			attr_dev(div2, "class", "input-group mb-3 w-50");
    			add_location(div2, file$1, 73, 6, 1523);
    			attr_dev(label3, "for", "desc");
    			attr_dev(label3, "class", "mr-3");
    			add_location(label3, file$1, 78, 8, 1761);
    			attr_dev(textarea, "rows", "3");
    			attr_dev(textarea, "class", "form-control");
    			attr_dev(textarea, "id", "desc");
    			add_location(textarea, file$1, 79, 8, 1820);
    			attr_dev(div3, "class", "input-group mb-3 w-50");
    			add_location(div3, file$1, 77, 6, 1717);
    			attr_dev(div4, "id", "form");
    			add_location(div4, file$1, 56, 4, 1022);
    			attr_dev(button0, "type", "submit");
    			attr_dev(button0, "class", "btn btn-primary");
    			add_location(button0, file$1, 87, 4, 1967);
    			attr_dev(form, "class", "mb-2");
    			add_location(form, file$1, 55, 2, 998);
    			attr_dev(button1, "class", "btn btn-danger");
    			add_location(button1, file$1, 95, 2, 2119);
    			attr_dev(button2, "class", "btn btn-warning");
    			add_location(button2, file$1, 96, 2, 2191);
    			attr_dev(button3, "class", "btn btn-info text-light");
    			add_location(button3, file$1, 97, 2, 2270);
    			attr_dev(div5, "class", "container my-4");
    			add_location(div5, file$1, 54, 0, 967);

    			dispose = [
    				listen_dev(input0, "input", ctx.input0_input_handler),
    				listen_dev(input1, "input", ctx.input1_input_handler),
    				listen_dev(input2, "input", ctx.input2_input_handler),
    				listen_dev(textarea, "input", ctx.textarea_input_handler),
    				listen_dev(button0, "click", prevent_default(ctx.addContact), false, true),
    				listen_dev(button1, "click", ctx.clearContact),
    				listen_dev(button2, "click", ctx.deleteFirst),
    				listen_dev(button3, "click", ctx.deleteLast)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, form);
    			append_dev(form, div4);
    			append_dev(div4, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t1);
    			append_dev(div0, input0);

    			set_input_value(input0, ctx.name);

    			append_dev(div4, t2);
    			append_dev(div4, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t4);
    			append_dev(div1, input1);

    			set_input_value(input1, ctx.title);

    			append_dev(div4, t5);
    			append_dev(div4, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t7);
    			append_dev(div2, input2);

    			set_input_value(input2, ctx.image);

    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, label3);
    			append_dev(div3, t10);
    			append_dev(div3, textarea);

    			set_input_value(textarea, ctx.description);

    			append_dev(form, t11);
    			append_dev(form, button0);
    			append_dev(div5, t13);
    			append_dev(div5, button1);
    			append_dev(div5, t15);
    			append_dev(div5, button2);
    			append_dev(div5, t17);
    			append_dev(div5, button3);
    			append_dev(div5, t19);
    			if_block.m(div5, null);
    			append_dev(div5, t20);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div5, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(div5, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.name && (input0.value !== ctx.name)) set_input_value(input0, ctx.name);
    			if (changed.title && (input1.value !== ctx.title)) set_input_value(input1, ctx.title);
    			if (changed.image && (input2.value !== ctx.image)) set_input_value(input2, ctx.image);
    			if (changed.description) set_input_value(textarea, ctx.description);

    			if (current_block_type !== (current_block_type = select_block_type(changed, ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);
    				if (if_block) {
    					if_block.c();
    					if_block.m(div5, t20);
    				}
    			}

    			const each_value = ctx.createdContacts;

    			group_outros();
    			each_blocks = update_keyed_each(each_blocks, changed, get_key, 1, ctx, each_value, each_1_lookup, div5, outro_and_destroy_block, create_each_block, null, get_each_context);
    			check_outros();

    			if (each_value.length) {
    				if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			} else if (!each_1_else) {
    				each_1_else = create_else_block(ctx);
    				each_1_else.c();
    				each_1_else.m(div5, null);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},

    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div5);
    			}

    			if_block.d();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (each_1_else) each_1_else.d();

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let name = "";
      let title = "";
      let image = "";
      let description = "";
      let formState = "empty";
      let createdContacts = [];

      function addContact() {
        if (
          name.trim().length == 0 ||
          title.trim().length == 0 ||
          image.trim().length == 0 ||
          description.trim().length == 0
        ) {
          $$invalidate('formState', formState = "invalid");
          return;
        }
        $$invalidate('createdContacts', createdContacts = [
          ...createdContacts,
          {
            id: Math.random(),
            name: name,
            jobTitle: title,
            imageUrl: image,
            desc: description
          }
        ]);
        $$invalidate('formState', formState = "done");
      }

      function clearContact() {
        $$invalidate('name', name = "");
        $$invalidate('title', title = "");
        $$invalidate('image', image = "");
        $$invalidate('description', description = "");
        $$invalidate('formState', formState = "empty");
      }

      function deleteFirst() {
        $$invalidate('createdContacts', createdContacts = createdContacts.slice(1));
      }

      function deleteLast() {
        $$invalidate('createdContacts', createdContacts = createdContacts.slice(0, -1));
      }

    	function input0_input_handler() {
    		name = this.value;
    		$$invalidate('name', name);
    	}

    	function input1_input_handler() {
    		title = this.value;
    		$$invalidate('title', title);
    	}

    	function input2_input_handler() {
    		image = this.value;
    		$$invalidate('image', image);
    	}

    	function textarea_input_handler() {
    		description = this.value;
    		$$invalidate('description', description);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate('name', name = $$props.name);
    		if ('title' in $$props) $$invalidate('title', title = $$props.title);
    		if ('image' in $$props) $$invalidate('image', image = $$props.image);
    		if ('description' in $$props) $$invalidate('description', description = $$props.description);
    		if ('formState' in $$props) $$invalidate('formState', formState = $$props.formState);
    		if ('createdContacts' in $$props) $$invalidate('createdContacts', createdContacts = $$props.createdContacts);
    	};

    	return {
    		name,
    		title,
    		image,
    		description,
    		formState,
    		createdContacts,
    		addContact,
    		clearContact,
    		deleteFirst,
    		deleteLast,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		textarea_input_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$1.name });
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
