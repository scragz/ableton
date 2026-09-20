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
		"rect" : [ 100.0, 100.0, 1100.0, 800.0 ],
		"bglocked" : 0,
		"openinpresentation" : 1,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15.0, 15.0 ],
		"gridsnaponopen" : 1,
		"objectsnaponopen" : 1,
		"statusbarvisible" : 2,
		"toolbarvisible" : 0,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 360.0,
		"description" : "Teevee",
		"digest" : "Parallel audio (MSP) and video (Jitter) processing",
		"tags" : "audio video jitter m4l feedback twin-engine",
		"style" : "",
		"subpatcher_template" : "",
		"boxes" : [
			{
				"box" : {
					"id" : "obj-comment-arch",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 700.0, 30.0, 350.0, 20.0 ],
					"text" : "v8 TWIN ENGINE: Parallel Processing (10 Effects)"
				}
			},
			{
				"box" : {
					"id" : "obj-param",
					"maxclass" : "newobj",
					"numinlets" : 13,
					"numoutlets" : 0,
					"patching_rect" : [ 700.0, 550.0, 650.0, 22.0 ],
					"text" : "tv.param"
				}
			},
			{
				"box" : {
					"id" : "obj-comment-path-a",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 70.0, 250.0, 20.0 ],
					"text" : "=== PATH A: HI-DEF AUDIO (MSP) ==="
				}
			},
			{
				"box" : {
					"id" : "obj-comment-path-b",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 450.0, 70.0, 250.0, 20.0 ],
					"text" : "=== PATH B: VISUALIZER (JITTER) ==="
				}
			},
			{
				"box" : {
					"id" : "obj-viz-matrix",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "jit_matrix", "" ],
					"patching_rect" : [ 450.0, 100.0, 220.0, 22.0 ],
					"text" : "jit.matrix ---tv_viz_ram 4 float32 65536"
				}
			},
			{
				"box" : {
					"id" : "obj-plugin",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "signal" ],
					"patching_rect" : [ 30.0, 100.0, 75.0, 22.0 ],
					"text" : "plugin~ 2 2"
				}
			},
			{
				"box" : {
					"id" : "obj-plugout",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 400.0, 84.0, 22.0 ],
					"text" : "plugout~ 1 2"
				}
			},
			{
				"box" : {
					"id" : "obj-audio",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "signal" ],
					"patching_rect" : [ 30.0, 200.0, 80.0, 22.0 ],
					"text" : "tv.audio"
				}
			},
			{
				"box" : {
					"id" : "obj-fx",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "signal" ],
					"patching_rect" : [ 30.0, 300.0, 60.0, 22.0 ],
					"text" : "tv.fx"
				}
			},
			{
				"box" : {
					"id" : "obj-sync",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "signal" ],
					"patching_rect" : [ 300.0, 140.0, 60.0, 22.0 ],
					"text" : "tv.sync"
				}
			},
			{
				"box" : {
					"id" : "obj-ingest",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 0,
					"patching_rect" : [ 450.0, 200.0, 60.0, 22.0 ],
					"text" : "tv.ingest"
				}
			},
			{
				"box" : {
					"id" : "obj-viz",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "jit_matrix" ],
					"patching_rect" : [ 450.0, 350.0, 45.0, 22.0 ],
					"text" : "tv.viz"
				}
			},
			{
				"box" : {
					"id" : "obj-qmetro",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 450.0, 280.0, 65.0, 22.0 ],
					"text" : "qmetro 16"
				}
			},
			{
				"box" : {
					"id" : "obj-toggle-render",
					"maxclass" : "toggle",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 450.0, 240.0, 24.0, 24.0 ],
					"saved_attribute_attributes" : {
						"valueof" : {
							"parameter_initial" : [ 1 ],
							"parameter_initial_enable" : 1
						}
					}
				}
			},
			{
				"box" : {
					"id" : "obj-loadbang",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 490.0, 240.0, 58.0, 22.0 ],
					"text" : "loadbang"
				}
			},			{
				"box" : {
					"id" : "obj-start-metro",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 490.0, 235.0, 29.5, 22.0 ],
					"text" : "1"
				}
			},			{
				"box" : {
					"id" : "obj-t1",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 490.0, 265.0, 22.0, 22.0 ],
					"text" : "t 1"
				}
			},

			{
				"box" : {
					"id" : "obj-dial-scroll",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 700.0, 100.0, 40.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 170.0, 7.0, 40.0, 48.0 ],
					"saved_attribute_attributes" : {
						"valueof" : {
							"parameter_longname" : "Scroll",
							"parameter_shortname" : "Scroll",
							"parameter_type" : 0,
							"parameter_unitstyle" : 1,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 1.0,
							"parameter_initial" : [ 0.0 ],
							"parameter_initial_enable" : 1
						}
					},
					"varname" : "scroll"
				}
			},
			{
				"box" : {
					"id" : "obj-dial-zoom",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 750.0, 100.0, 40.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 170.0, 60.0, 40.0, 48.0 ],
					"saved_attribute_attributes" : {
						"valueof" : {
							"parameter_longname" : "Zoom",
							"parameter_shortname" : "Zoom",
							"parameter_type" : 0,
							"parameter_unitstyle" : 1,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 1.0,
							"parameter_initial" : [ 0.5 ],
							"parameter_initial_enable" : 1
						}
					},
					"varname" : "zoom"
				}
			},
			{
				"box" : {
					"id" : "obj-dial-rotate",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 800.0, 100.0, 40.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 170.0, 113.0, 40.0, 48.0 ],
					"saved_attribute_attributes" : {
						"valueof" : {
							"parameter_longname" : "Rotate",
							"parameter_shortname" : "Rotate",
							"parameter_type" : 0,
							"parameter_unitstyle" : 1,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 1.0,
							"parameter_initial" : [ 0.5 ],
							"parameter_initial_enable" : 1
						}
					},
					"varname" : "rotate"
				}
			},

			{
				"box" : {
					"id" : "obj-dial-mosaic",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 850.0, 100.0, 40.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 217.0, 7.0, 40.0, 48.0 ],
					"saved_attribute_attributes" : {
						"valueof" : {
							"parameter_longname" : "Mosaic",
							"parameter_shortname" : "Mosaic",
							"parameter_type" : 0,
							"parameter_unitstyle" : 1,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 1.0,
							"parameter_initial" : [ 0.0 ],
							"parameter_initial_enable" : 1
						}
					},
					"varname" : "mosaic"
				}
			},
			{
				"box" : {
					"id" : "obj-dial-aberration",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 900.0, 100.0, 40.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 264.0, 7.0, 40.0, 48.0 ],
					"saved_attribute_attributes" : {
						"valueof" : {
							"parameter_longname" : "Aberration",
							"parameter_shortname" : "Aberr",
							"parameter_type" : 0,
							"parameter_unitstyle" : 1,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 1.0,
							"parameter_initial" : [ 0.0 ],
							"parameter_initial_enable" : 1
						}
					},
					"varname" : "aberration"
				}
			},
			{
				"box" : {
					"id" : "obj-dial-bloom",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 950.0, 100.0, 40.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 217.0, 60.0, 40.0, 48.0 ],
					"saved_attribute_attributes" : {
						"valueof" : {
							"parameter_longname" : "Bloom",
							"parameter_shortname" : "Bloom",
							"parameter_type" : 0,
							"parameter_unitstyle" : 1,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 1.0,
							"parameter_initial" : [ 0.0 ],
							"parameter_initial_enable" : 1
						}
					},
					"varname" : "bloom"
				}
			},
			{
				"box" : {
					"id" : "obj-dial-solarize",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 1000.0, 100.0, 40.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 264.0, 60.0, 40.0, 48.0 ],
					"saved_attribute_attributes" : {
						"valueof" : {
							"parameter_longname" : "Solarize",
							"parameter_shortname" : "Solar",
							"parameter_type" : 0,
							"parameter_unitstyle" : 1,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 1.0,
							"parameter_initial" : [ 0.0 ],
							"parameter_initial_enable" : 1
						}
					},
					"varname" : "solarize"
				}
			},
			{
				"box" : {
					"id" : "obj-dial-crush",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 1050.0, 100.0, 40.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 217.0, 113.0, 40.0, 48.0 ],
					"saved_attribute_attributes" : {
						"valueof" : {
							"parameter_longname" : "Crush",
							"parameter_shortname" : "Crush",
							"parameter_type" : 0,
							"parameter_unitstyle" : 1,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 1.0,
							"parameter_initial" : [ 0.0 ],
							"parameter_initial_enable" : 1
						}
					},
					"varname" : "crush"
				}
			},

			{
				"box" : {
					"id" : "obj-dial-shutter",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 1100.0, 100.0, 40.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 311.0, 7.0, 40.0, 48.0 ],
					"saved_attribute_attributes" : {
						"valueof" : {
							"parameter_longname" : "Shutter",
							"parameter_shortname" : "Shutter",
							"parameter_type" : 0,
							"parameter_unitstyle" : 1,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 1.0,
							"parameter_initial" : [ 0.0 ],
							"parameter_initial_enable" : 1
						}
					},
					"varname" : "shutter"
				}
			},
			{
				"box" : {
					"id" : "obj-dial-ghosting",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 1150.0, 100.0, 40.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 311.0, 60.0, 40.0, 48.0 ],
					"saved_attribute_attributes" : {
						"valueof" : {
							"parameter_longname" : "Ghosting",
							"parameter_shortname" : "Ghost",
							"parameter_type" : 0,
							"parameter_unitstyle" : 1,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 1.0,
							"parameter_initial" : [ 0.0 ],
							"parameter_initial_enable" : 1
						}
					},
					"varname" : "ghosting"
				}
			},
			{
				"box" : {
					"id" : "obj-dial-smear",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 1200.0, 100.0, 40.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 311.0, 113.0, 40.0, 48.0 ],
					"saved_attribute_attributes" : {
						"valueof" : {
							"parameter_longname" : "Smear",
							"parameter_shortname" : "Smear",
							"parameter_type" : 0,
							"parameter_unitstyle" : 1,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 1.0,
							"parameter_initial" : [ 0.0 ],
							"parameter_initial_enable" : 1
						}
					},
					"varname" : "smear"
				}
			},

			{
				"box" : {
					"id" : "obj-dial-freeze",
					"maxclass" : "live.dial",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "", "float" ],
					"parameter_enable" : 1,
					"patching_rect" : [ 1250.0, 100.0, 40.0, 48.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 264.0, 113.0, 40.0, 48.0 ],
					"saved_attribute_attributes" : {
						"valueof" : {
							"parameter_longname" : "Freeze",
							"parameter_shortname" : "Freeze",
							"parameter_type" : 0,
							"parameter_unitstyle" : 1,
							"parameter_mmin" : 0.0,
							"parameter_mmax" : 1.0,
							"parameter_initial" : [ 0.0 ],
							"parameter_initial_enable" : 1
						}
					},
					"varname" : "freeze"
				}
			},

			{
				"box" : {
					"id" : "obj-pwindow",
					"maxclass" : "jit.pwindow",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "jit_matrix", "" ],
					"patching_rect" : [ 450.0, 550.0, 192.0, 192.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 5.0, 5.0, 159.0, 159.0 ]
				}
			},
			{
				"box" : {
					"bgcolor" : [ 0.15, 0.15, 0.15, 1.0 ],
					"id" : "obj-panel",
					"maxclass" : "panel",
					"mode" : 0,
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 700.0, 560.0, 100.0, 30.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 0.0, 0.0, 360.0, 169.0 ]
				}
			}
		],
		"lines" : [
			{
				"patchline" : {
					"destination" : [ "obj-audio", 0 ],
					"order" : 1,
					"source" : [ "obj-plugin", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ingest", 0 ],
					"order" : 0,
					"source" : [ "obj-plugin", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-audio", 1 ],
					"order" : 1,
					"source" : [ "obj-plugin", 1 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ingest", 1 ],
					"order" : 0,
					"source" : [ "obj-plugin", 1 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-fx", 0 ],
					"source" : [ "obj-audio", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-fx", 1 ],
					"source" : [ "obj-audio", 1 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-plugout", 0 ],
					"source" : [ "obj-fx", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-plugout", 1 ],
					"source" : [ "obj-fx", 1 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ingest", 2 ],
					"source" : [ "obj-sync", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-qmetro", 0 ],
					"source" : [ "obj-toggle-render", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-start-metro", 0 ],
					"source" : [ "obj-loadbang", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-toggle-render", 0 ],
					"source" : [ "obj-start-metro", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-toggle-render", 0 ],
					"source" : [ "obj-t1", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-viz", 0 ],
					"source" : [ "obj-qmetro", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-pwindow", 0 ],
					"source" : [ "obj-viz", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-param", 0 ],
					"source" : [ "obj-dial-scroll", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-param", 1 ],
					"source" : [ "obj-dial-zoom", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-param", 2 ],
					"source" : [ "obj-dial-rotate", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-param", 3 ],
					"source" : [ "obj-dial-mosaic", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-param", 4 ],
					"source" : [ "obj-dial-aberration", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-param", 5 ],
					"source" : [ "obj-dial-bloom", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-param", 6 ],
					"source" : [ "obj-dial-solarize", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-param", 7 ],
					"source" : [ "obj-dial-crush", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-param", 8 ],
					"source" : [ "obj-dial-shutter", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-param", 9 ],
					"source" : [ "obj-dial-ghosting", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-param", 10 ],
					"source" : [ "obj-dial-smear", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-param", 11 ],
					"source" : [ "obj-dial-freeze", 0 ]
				}
			}
		],
		"parameters" : {
			"obj-dial-scroll" : [ "Scroll", "Scroll", 0 ],
			"obj-dial-zoom" : [ "Zoom", "Zoom", 0 ],
			"obj-dial-rotate" : [ "Rotate", "Rotate", 0 ],
			"obj-dial-mosaic" : [ "Mosaic", "Mosaic", 0 ],
			"obj-dial-aberration" : [ "Aberration", "Aberr", 0 ],
			"obj-dial-bloom" : [ "Bloom", "Bloom", 0 ],
			"obj-dial-solarize" : [ "Solarize", "Solar", 0 ],
			"obj-dial-crush" : [ "Crush", "Crush", 0 ],
			"obj-dial-shutter" : [ "Shutter", "Shutter", 0 ],
			"obj-dial-ghosting" : [ "Ghosting", "Ghost", 0 ],
			"obj-dial-smear" : [ "Smear", "Smear", 0 ],
			"obj-dial-freeze" : [ "Freeze", "Freeze", 0 ],
			"parameterbanks" : {
				"0" : {
					"index" : 0,
					"name" : "",
					"parameters" : [ "-", "-", "-", "-", "-", "-", "-", "-" ]
				}
			},
			"inherited_shortname" : 1
		},
		"dependency_cache" : [
			{
				"name" : "tv.audio.maxpat",
				"bootpath" : "~/Projects/max/teevee/modules",
				"type" : "JSON",
				"implicit" : 1
			},
			{
				"name" : "tv.sync.maxpat",
				"bootpath" : "~/Projects/max/teevee/modules",
				"type" : "JSON",
				"implicit" : 1
			},
			{
				"name" : "tv.ingest.maxpat",
				"bootpath" : "~/Projects/max/teevee/modules",
				"type" : "JSON",
				"implicit" : 1
			},
			{
				"name" : "tv.fx.maxpat",
				"bootpath" : "~/Projects/max/teevee/modules",
				"type" : "JSON",
				"implicit" : 1
			},
			{
				"name" : "tv.viz.maxpat",
				"bootpath" : "~/Projects/max/teevee/modules",
				"type" : "JSON",
				"implicit" : 1
			},
			{
				"name" : "tv.param.maxpat",
				"bootpath" : "~/Projects/max/teevee/modules",
				"type" : "JSON",
				"implicit" : 1
			}
		],
		"autosave" : 0
	}
}
