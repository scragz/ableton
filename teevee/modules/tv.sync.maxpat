{
	"patcher" : {
		"fileversion" : 1,
		"appversion" : {
			"major" : 8,
			"minor" : 6,
			"revision" : 0,
			"architecture" : "x64",
			"modernui" : 1
		},
		"classnamespace" : "box",
		"rect" : [ 100.0, 100.0, 900.0, 650.0 ],
		"bglocked" : 0,
		"openinpresentation" : 0,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15.0, 15.0 ],
		"gridsnaponopen" : 1,
		"objectsnaponopen" : 1,
		"statusbarvisible" : 2,
		"toolbarvisible" : 1,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "tv.sync - Master clock, index generation, and scrub LFO",
		"digest" : "Centralized timing for read/write synchronization with tape slip modulation",
		"tags" : "teevee, sync, clock, scrub, lfo",
		"style" : "",
		"subpatcher_template" : "",
		"assistshowspatchername" : 0,
		"boxes" : [
			{
				"box" : {
					"comment" : "Write Index X (0-255)",
					"id" : "obj-out1",
					"index" : 1,
					"maxclass" : "outlet",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 450.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Linear Read Index (0-65535)",
					"id" : "obj-out2",
					"index" : 2,
					"maxclass" : "outlet",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 200.0, 450.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-comment1",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 400.0, 50.0, 250.0, 20.0 ],
					"text" : "tv.sync - Master Clock Module"
				}
			},
			{
				"box" : {
					"id" : "obj-scrub-section",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 500.0, 100.0, 250.0, 20.0 ],
					"text" : "=== SCRUB LFO (Tape Slip) ==="
				}
			},
			{
				"box" : {
					"id" : "obj-r-scrub",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 500.0, 130.0, 100.0, 22.0 ],
					"text" : "r ---tv_scrub_amt"
				}
			},
			{
				"box" : {
					"id" : "obj-scrub-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 500.0, 160.0, 60.0, 22.0 ],
					"text" : "line~ 0 20"
				}
			},
			{
				"box" : {
					"id" : "obj-noise",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 620.0, 160.0, 45.0, 22.0 ],
					"text" : "noise~"
				}
			},
			{
				"box" : {
					"id" : "obj-noise-lp",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 620.0, 190.0, 80.0, 22.0 ],
					"text" : "onepole~ 0.99"
				}
			},
			{
				"box" : {
					"id" : "obj-scrub-scale",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 500.0, 220.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-scrub-audio-scale",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 500.0, 260.0, 55.0, 22.0 ],
					"text" : "*~ 500."
				}
			},
			{
				"box" : {
					"id" : "obj-s-scrub-audio",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 500.0, 300.0, 130.0, 22.0 ],
					"text" : "send~ ---tv_scrub_audio"
				}
			},
			{
				"box" : {
					"id" : "obj-scrub-viz-scale",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 680.0, 260.0, 50.0, 22.0 ],
					"text" : "*~ 0.1"
				}
			},
			{
				"box" : {
					"id" : "obj-snapshot-scrub",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "float", "bang" ],
					"patching_rect" : [ 680.0, 300.0, 70.0, 22.0 ],
					"text" : "snapshot~ 30"
				}
			},
			{
				"box" : {
					"id" : "obj-s-scrub-viz",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 680.0, 340.0, 110.0, 22.0 ],
					"text" : "s ---tv_scrub_viz"
				}
			},
			{
				"box" : {
					"id" : "obj-phasor-row",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 100.0, 72.0, 22.0 ],
					"text" : "phasor~ 172"
				}
			},
			{
				"box" : {
					"id" : "obj-scale-write-x",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 140.0, 120.0, 22.0 ],
					"text" : "scale~ 0. 1. 0. 255."
				}
			},
			{
				"box" : {
					"id" : "obj-floor-x",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 180.0, 45.0, 22.0 ],
					"text" : "trunc~"
				}
			},
			{
				"box" : {
					"id" : "obj-delta",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 220.0, 45.0, 22.0 ],
					"text" : "delta~"
				}
			},
			{
				"box" : {
					"id" : "obj-lessthan",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 260.0, 45.0, 22.0 ],
					"text" : "<~ 0."
				}
			},
			{
				"box" : {
					"id" : "obj-edge",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "bang", "bang" ],
					"patching_rect" : [ 50.0, 300.0, 45.0, 22.0 ],
					"text" : "edge~"
				}
			},
			{
				"box" : {
					"id" : "obj-counter",
					"maxclass" : "newobj",
					"numinlets" : 5,
					"numoutlets" : 4,
					"outlettype" : [ "int", "", "", "int" ],
					"patching_rect" : [ 50.0, 340.0, 100.0, 22.0 ],
					"text" : "counter 0 0 255"
				}
			},
			{
				"box" : {
					"id" : "obj-send-y",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 380.0, 100.0, 22.0 ],
					"text" : "s tv_write_y"
				}
			},
			{
				"box" : {
					"id" : "obj-send-x",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 160.0, 380.0, 100.0, 22.0 ],
					"text" : "send~ tv_write_x"
				}
			},
			{
				"box" : {
					"id" : "obj-phasor-full",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 200.0, 100.0, 100.0, 22.0 ],
					"text" : "phasor~ 0.67188"
				}
			},
			{
				"box" : {
					"id" : "obj-scale-read",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 200.0, 140.0, 130.0, 22.0 ],
					"text" : "scale~ 0. 1. 0. 65535."
				}
			},
			{
				"box" : {
					"id" : "obj-floor-read",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 200.0, 180.0, 45.0, 22.0 ],
					"text" : "trunc~"
				}
			}
		],
		"lines" : [
			{
				"patchline" : {
					"destination" : [ "obj-scrub-line", 0 ],
					"source" : [ "obj-r-scrub", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-noise-lp", 0 ],
					"source" : [ "obj-noise", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scrub-scale", 1 ],
					"source" : [ "obj-noise-lp", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scrub-scale", 0 ],
					"source" : [ "obj-scrub-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scrub-audio-scale", 0 ],
					"order" : 1,
					"source" : [ "obj-scrub-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scrub-viz-scale", 0 ],
					"order" : 0,
					"source" : [ "obj-scrub-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-scrub-audio", 0 ],
					"source" : [ "obj-scrub-audio-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-snapshot-scrub", 0 ],
					"source" : [ "obj-scrub-viz-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-scrub-viz", 0 ],
					"source" : [ "obj-snapshot-scrub", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-write-x", 0 ],
					"source" : [ "obj-phasor-row", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-floor-x", 0 ],
					"source" : [ "obj-scale-write-x", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-out1", 0 ],
					"order" : 1,
					"source" : [ "obj-floor-x", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-delta", 0 ],
					"order" : 0,
					"source" : [ "obj-floor-x", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-lessthan", 0 ],
					"source" : [ "obj-delta", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-edge", 0 ],
					"source" : [ "obj-lessthan", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-counter", 0 ],
					"source" : [ "obj-edge", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-send-y", 0 ],
					"source" : [ "obj-counter", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-read", 0 ],
					"source" : [ "obj-phasor-full", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-floor-read", 0 ],
					"source" : [ "obj-scale-read", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-out2", 0 ],
					"source" : [ "obj-floor-read", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-send-x", 0 ],
					"source" : [ "obj-floor-x", 0 ]
				}
			}
		]
	}
}
