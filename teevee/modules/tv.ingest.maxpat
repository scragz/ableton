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
		"rect" : [ 100.0, 100.0, 700.0, 550.0 ],
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
		"description" : "tv.ingest - Audio feature writer for VISUALIZATION ONLY (v7)",
		"digest" : "Encodes audio features to ARGB matrix for display - NOT for audio reconstruction",
		"tags" : "teevee, ingest, writer, encode, visualization",
		"style" : "",
		"subpatcher_template" : "",
		"assistshowspatchername" : 0,
		"boxes" : [
			{
				"box" : {
					"id" : "obj-title",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 400.0, 30.0, 280.0, 20.0 ],
					"text" : "tv.ingest v7 - VISUALIZATION ONLY (Path B)"
				}
			},
			{
				"box" : {
					"id" : "obj-note",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 400.0, 50.0, 280.0, 20.0 ],
					"text" : "Audio output comes from tv.audio (Path A)",
					"textcolor" : [ 0.5, 0.5, 0.5, 1.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-viz-matrix",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "jit_matrix", "" ],
					"patching_rect" : [ 400.0, 80.0, 220.0, 22.0 ],
					"text" : "jit.matrix tv_viz_ram 4 float32 65536"
				}
			},
			{
				"box" : {
					"comment" : "Audio Left",
					"id" : "obj-in1",
					"index" : 1,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 30.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Audio Right",
					"id" : "obj-in2",
					"index" : 2,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 120.0, 30.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Write Index X (0-255 signal)",
					"id" : "obj-in3",
					"index" : 3,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 200.0, 30.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-recv-x",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 240.0, 30.0, 110.0, 22.0 ],
					"text" : "receive~ tv_write_x"
				}
			},
			{
				"box" : {
					"id" : "obj-encode",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 4,
					"outlettype" : [ "signal", "signal", "signal", "signal" ],
					"patching_rect" : [ 50.0, 100.0, 150.0, 22.0 ],
					"text" : "gen~",
					"patcher" : {
						"fileversion" : 1,
						"appversion" : {
							"major" : 8,
							"minor" : 6,
							"revision" : 0,
							"architecture" : "x64",
							"modernui" : 1
						},
						"classnamespace" : "dsp.gen",
						"rect" : [ 100.0, 100.0, 600.0, 450.0 ],
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
						"description" : "",
						"digest" : "",
						"tags" : "",
						"style" : "",
						"subpatcher_template" : "",
						"boxes" : [
							{
								"box" : {
									"id" : "obj-in1",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 50.0, 30.0, 30.0, 22.0 ],
									"text" : "in 1"
								}
							},
							{
								"box" : {
									"id" : "obj-in2",
									"maxclass" : "newobj",
									"numinlets" : 0,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 150.0, 30.0, 30.0, 22.0 ],
									"text" : "in 2"
								}
							},
							{
								"box" : {
									"id" : "obj-codebox",
									"maxclass" : "codebox",
									"numinlets" : 2,
									"numoutlets" : 4,
									"outlettype" : [ "", "", "", "" ],
									"patching_rect" : [ 50.0, 80.0, 400.0, 250.0 ],
									"code" : "// MS-Flux Mapping for Visualization (v7)\n// This data is for DISPLAY ONLY - not audio reconstruction\n\nHistory prev_mid(0);\n\n// Inputs\nLeft = in1;\nRight = in2;\n\n// Mid/Side encoding\nMid = (Left + Right) * 0.5;\nSide = (Left - Right) * 0.5;\n\n// Plane 0 (Alpha): RMS Amplitude envelope\nAlpha = slide(abs(Mid), 10, 100);\n\n// Plane 1 (Red): Mono Signal (waveform)\nRed = Mid;\n\n// Plane 2 (Green): Spectral Flux (high-frequency content)\nFlux = abs(Mid - prev_mid);\nprev_mid = Mid;\nGreen = Flux;\n\n// Plane 3 (Blue): Stereo Width (side channel)\nBlue = Side;\n\n// Outputs (ARGB planes for visualization)\nout1 = Alpha;\nout2 = Red;\nout3 = Green;\nout4 = Blue;"
								}
							},
							{
								"box" : {
									"id" : "obj-out1",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 50.0, 360.0, 35.0, 22.0 ],
									"text" : "out 1"
								}
							},
							{
								"box" : {
									"id" : "obj-out2",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 150.0, 360.0, 35.0, 22.0 ],
									"text" : "out 2"
								}
							},
							{
								"box" : {
									"id" : "obj-out3",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 250.0, 360.0, 35.0, 22.0 ],
									"text" : "out 3"
								}
							},
							{
								"box" : {
									"id" : "obj-out4",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 350.0, 360.0, 35.0, 22.0 ],
									"text" : "out 4"
								}
							}
						],
						"lines" : [
							{
								"patchline" : {
									"destination" : [ "obj-codebox", 0 ],
									"source" : [ "obj-in1", 0 ]
								}
							},
							{
								"patchline" : {
									"destination" : [ "obj-codebox", 1 ],
									"source" : [ "obj-in2", 0 ]
								}
							},
							{
								"patchline" : {
									"destination" : [ "obj-out1", 0 ],
									"source" : [ "obj-codebox", 0 ]
								}
							},
							{
								"patchline" : {
									"destination" : [ "obj-out2", 0 ],
									"source" : [ "obj-codebox", 1 ]
								}
							},
							{
								"patchline" : {
									"destination" : [ "obj-out3", 0 ],
									"source" : [ "obj-codebox", 2 ]
								}
							},
							{
								"patchline" : {
									"destination" : [ "obj-out4", 0 ],
									"source" : [ "obj-codebox", 3 ]
								}
							}
						]
					}
				}
			},
			{
				"box" : {
					"id" : "obj-linear-index",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 200.0, 200.0, 30.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-y-counter",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 100.0, 85.0, 22.0 ],
					"text" : "r tv_write_y"
				}
			},
			{
				"box" : {
					"id" : "obj-sig-y",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 300.0, 130.0, 31.0, 22.0 ],
					"text" : "sig~"
				}
			},
			{
				"box" : {
					"id" : "obj-y-times-256",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 300.0, 160.0, 45.0, 22.0 ],
					"text" : "*~ 256"
				}
			},
			{
				"box" : {
					"id" : "obj-r-freeze",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 400.0, 120.0, 110.0, 22.0 ],
					"text" : "r tv_param_freeze"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-sig",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 400.0, 150.0, 33.0, 22.0 ],
					"text" : "sig~"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-inv",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 400.0, 180.0, 45.0, 22.0 ],
					"text" : "!-~ 1."
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-gate",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 200.0, 230.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-offset",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 250.0, 230.0, 40.0, 22.0 ],
					"text" : "*~ -1."
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-combine",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 200.0, 260.0, 30.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-poke-alpha",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 280.0, 140.0, 22.0 ],
					"text" : "jit.poke~ tv_viz_ram 1 0"
				}
			},
			{
				"box" : {
					"id" : "obj-poke-red",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 320.0, 140.0, 22.0 ],
					"text" : "jit.poke~ tv_viz_ram 1 1"
				}
			},
			{
				"box" : {
					"id" : "obj-poke-green",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 360.0, 140.0, 22.0 ],
					"text" : "jit.poke~ tv_viz_ram 1 2"
				}
			},
			{
				"box" : {
					"id" : "obj-poke-blue",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 400.0, 140.0, 22.0 ],
					"text" : "jit.poke~ tv_viz_ram 1 3"
				}
			}
		],
		"lines" : [
			{
				"patchline" : {
					"destination" : [ "obj-encode", 0 ],
					"source" : [ "obj-in1", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-encode", 1 ],
					"source" : [ "obj-in2", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-linear-index", 0 ],
					"source" : [ "obj-recv-x", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-poke-alpha", 0 ],
					"source" : [ "obj-encode", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-poke-red", 0 ],
					"source" : [ "obj-encode", 1 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-poke-green", 0 ],
					"source" : [ "obj-encode", 2 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-poke-blue", 0 ],
					"source" : [ "obj-encode", 3 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-sig-y", 0 ],
					"source" : [ "obj-y-counter", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-y-times-256", 0 ],
					"source" : [ "obj-sig-y", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-linear-index", 1 ],
					"source" : [ "obj-y-times-256", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-gate", 0 ],
					"source" : [ "obj-linear-index", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-sig", 0 ],
					"source" : [ "obj-r-freeze", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-inv", 0 ],
					"order" : 0,
					"source" : [ "obj-freeze-sig", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-offset", 0 ],
					"order" : 1,
					"source" : [ "obj-freeze-sig", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-gate", 1 ],
					"source" : [ "obj-freeze-inv", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-combine", 1 ],
					"source" : [ "obj-freeze-offset", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-combine", 0 ],
					"source" : [ "obj-freeze-gate", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-poke-alpha", 1 ],
					"source" : [ "obj-freeze-combine", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-poke-red", 1 ],
					"source" : [ "obj-freeze-combine", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-poke-green", 1 ],
					"source" : [ "obj-freeze-combine", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-poke-blue", 1 ],
					"source" : [ "obj-freeze-combine", 0 ]
				}
			}
		]
	}
}
