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
		"rect" : [ 100.0, 100.0, 1200.0, 900.0 ],
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
		"description" : "tv.viz - Visual effects processor using unified GPU shader",
		"digest" : "Parallel Twin Engine visual processor with all 10 effects",
		"tags" : "teevee, viz, effects, shader, gpu",
		"style" : "",
		"subpatcher_template" : "",
		"assistshowspatchername" : 0,
		"boxes" : [
			{
				"box" : {
					"comment" : "Bang to process frame",
					"id" : "obj-inlet",
					"index" : 1,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 50.0, 30.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Processed 2D matrix output for visualization",
					"id" : "obj-outlet",
					"index" : 1,
					"maxclass" : "outlet",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 820.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-trigger",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 15,
					"outlettype" : [ "bang", "bang", "bang", "bang", "bang", "bang", "bang", "bang", "bang", "bang", "bang", "bang", "bang", "bang", "bang" ],
					"patching_rect" : [ 50.0, 70.0, 1050.0, 22.0 ],
					"text" : "t b b b b b b b b b b b b b b b"
				}
			},
			{
				"box" : {
					"id" : "obj-comment-params",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 110.0, 400.0, 20.0 ],
					"text" : "=== PARAMETER RECEIVES (Geometry + 7 New Effects) ==="
				}
			},
			{
				"box" : {
					"id" : "obj-r-scroll",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 50.0, 140.0, 110.0, 22.0 ],
					"text" : "r tv_param_scroll"
				}
			},
			{
				"box" : {
					"id" : "obj-scroll-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 50.0, 170.0, 55.0, 22.0 ],
					"text" : "float 0.5"
				}
			},
			{
				"box" : {
					"id" : "obj-scroll-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 50.0, 200.0, 110.0, 22.0 ],
					"text" : "prepend scroll_speed"
				}
			},
			{
				"box" : {
					"id" : "obj-r-zoom",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 180.0, 140.0, 105.0, 22.0 ],
					"text" : "r tv_param_zoom"
				}
			},
			{
				"box" : {
					"id" : "obj-zoom-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 180.0, 170.0, 55.0, 22.0 ],
					"text" : "float 0.5"
				}
			},
			{
				"box" : {
					"id" : "obj-zoom-scale",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 180.0, 200.0, 100.0, 22.0 ],
					"text" : "scale 0. 1. 0.5 2."
				}
			},
			{
				"box" : {
					"id" : "obj-zoom-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 180.0, 230.0, 85.0, 22.0 ],
					"text" : "prepend zoom"
				}
			},
			{
				"box" : {
					"id" : "obj-r-rotation",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 140.0, 120.0, 22.0 ],
					"text" : "r tv_param_rotation"
				}
			},
			{
				"box" : {
					"id" : "obj-rotation-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 300.0, 170.0, 55.0, 22.0 ],
					"text" : "float 0.5"
				}
			},
			{
				"box" : {
					"id" : "obj-rotation-scale",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 200.0, 145.0, 22.0 ],
					"text" : "scale 0. 1. -3.14159 3.14159"
				}
			},
			{
				"box" : {
					"id" : "obj-rotation-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 230.0, 95.0, 22.0 ],
					"text" : "prepend rotation"
				}
			},
			{
				"box" : {
					"id" : "obj-r-smear",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 430.0, 140.0, 110.0, 22.0 ],
					"text" : "r tv_param_smear"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 430.0, 170.0, 45.0, 22.0 ],
					"text" : "float 0."
				}
			},
			{
				"box" : {
					"id" : "obj-smear-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 430.0, 200.0, 90.0, 22.0 ],
					"text" : "prepend smear"
				}
			},
			{
				"box" : {
					"id" : "obj-r-edge",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 550.0, 140.0, 105.0, 22.0 ],
					"text" : "r tv_param_edge"
				}
			},
			{
				"box" : {
					"id" : "obj-edge-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 550.0, 170.0, 45.0, 22.0 ],
					"text" : "float 0."
				}
			},
			{
				"box" : {
					"id" : "obj-edge-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 550.0, 200.0, 115.0, 22.0 ],
					"text" : "prepend edge_amount"
				}
			},
			{
				"box" : {
					"id" : "obj-r-warp",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 690.0, 140.0, 105.0, 22.0 ],
					"text" : "r tv_param_warp"
				}
			},
			{
				"box" : {
					"id" : "obj-warp-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 690.0, 170.0, 55.0, 22.0 ],
					"text" : "float 0.5"
				}
			},
			{
				"box" : {
					"id" : "obj-warp-scale",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 690.0, 200.0, 95.0, 22.0 ],
					"text" : "scale 0. 1. -1. 1."
				}
			},
			{
				"box" : {
					"id" : "obj-warp-prepend-x",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 690.0, 230.0, 90.0, 22.0 ],
					"text" : "prepend warp_x"
				}
			},
			{
				"box" : {
					"id" : "obj-warp-prepend-y",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 690.0, 260.0, 90.0, 22.0 ],
					"text" : "prepend warp_y"
				}
			},
			{
				"box" : {
					"id" : "obj-r-scrub",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 810.0, 140.0, 70.0, 22.0 ],
					"text" : "r tv_scrub"
				}
			},
			{
				"box" : {
					"id" : "obj-scrub-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 810.0, 170.0, 45.0, 22.0 ],
					"text" : "float 0."
				}
			},
			{
				"box" : {
					"id" : "obj-scrub-prepend",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 810.0, 200.0, 85.0, 22.0 ],
					"text" : "prepend scrub"
				}
			},
			{
				"box" : {
					"id" : "obj-comment-new-effects",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 300.0, 300.0, 20.0 ],
					"text" : "=== NEW ARTIFACT EFFECTS (7 params) ==="
				}
			},
			{
				"box" : {
					"id" : "obj-r-mosaic",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 50.0, 330.0, 115.0, 22.0 ],
					"text" : "r tv_param_mosaic"
				}
			},
			{
				"box" : {
					"id" : "obj-mosaic-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 50.0, 360.0, 45.0, 22.0 ],
					"text" : "float 0."
				}
			},
			{
				"box" : {
					"id" : "obj-mosaic-scale",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 50.0, 390.0, 120.0, 22.0 ],
					"text" : "scale 0. 1. 2048. 10."
				}
			},
			{
				"box" : {
					"id" : "obj-mosaic-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 50.0, 420.0, 95.0, 22.0 ],
					"text" : "prepend mosaic"
				}
			},
			{
				"box" : {
					"id" : "obj-r-aberration",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 180.0, 330.0, 135.0, 22.0 ],
					"text" : "r tv_param_aberration"
				}
			},
			{
				"box" : {
					"id" : "obj-aberration-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 180.0, 360.0, 45.0, 22.0 ],
					"text" : "float 0."
				}
			},
			{
				"box" : {
					"id" : "obj-aberration-scale",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 180.0, 390.0, 115.0, 22.0 ],
					"text" : "scale 0. 1. 0. 0.05"
				}
			},
			{
				"box" : {
					"id" : "obj-aberration-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 180.0, 420.0, 115.0, 22.0 ],
					"text" : "prepend aberration"
				}
			},
			{
				"box" : {
					"id" : "obj-r-bloom",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 330.0, 330.0, 115.0, 22.0 ],
					"text" : "r tv_param_bloom"
				}
			},
			{
				"box" : {
					"id" : "obj-bloom-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 330.0, 360.0, 45.0, 22.0 ],
					"text" : "float 0."
				}
			},
			{
				"box" : {
					"id" : "obj-bloom-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 330.0, 390.0, 90.0, 22.0 ],
					"text" : "prepend bloom"
				}
			},
			{
				"box" : {
					"id" : "obj-r-solarize",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 460.0, 330.0, 120.0, 22.0 ],
					"text" : "r tv_param_solarize"
				}
			},
			{
				"box" : {
					"id" : "obj-solarize-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 460.0, 360.0, 45.0, 22.0 ],
					"text" : "float 1."
				}
			},
			{
				"box" : {
					"id" : "obj-solarize-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 460.0, 390.0, 95.0, 22.0 ],
					"text" : "prepend solarize"
				}
			},
			{
				"box" : {
					"id" : "obj-r-crush",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 590.0, 330.0, 110.0, 22.0 ],
					"text" : "r tv_param_crush"
				}
			},
			{
				"box" : {
					"id" : "obj-crush-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 590.0, 360.0, 45.0, 22.0 ],
					"text" : "float 1."
				}
			},
			{
				"box" : {
					"id" : "obj-crush-scale",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 590.0, 390.0, 110.0, 22.0 ],
					"text" : "scale 0. 1. 255. 2."
				}
			},
			{
				"box" : {
					"id" : "obj-crush-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 590.0, 420.0, 85.0, 22.0 ],
					"text" : "prepend crush"
				}
			},
			{
				"box" : {
					"id" : "obj-r-shutter",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 720.0, 330.0, 115.0, 22.0 ],
					"text" : "r tv_param_shutter"
				}
			},
			{
				"box" : {
					"id" : "obj-shutter-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 720.0, 360.0, 45.0, 22.0 ],
					"text" : "float 0."
				}
			},
			{
				"box" : {
					"id" : "obj-shutter-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 720.0, 390.0, 90.0, 22.0 ],
					"text" : "prepend shutter"
				}
			},
			{
				"box" : {
					"id" : "obj-r-ghosting",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 850.0, 330.0, 120.0, 22.0 ],
					"text" : "r tv_param_ghosting"
				}
			},
			{
				"box" : {
					"id" : "obj-ghosting-store",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 850.0, 360.0, 45.0, 22.0 ],
					"text" : "float 0."
				}
			},
			{
				"box" : {
					"id" : "obj-ghosting-scale",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 850.0, 390.0, 105.0, 22.0 ],
					"text" : "scale 0. 1. 0. 0.5"
				}
			},
			{
				"box" : {
					"id" : "obj-ghosting-prepend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 850.0, 420.0, 100.0, 22.0 ],
					"text" : "prepend ghosting"
				}
			},
			{
				"box" : {
					"id" : "obj-comment-processing",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 480.0, 300.0, 20.0 ],
					"text" : "=== PROCESSING CHAIN ==="
				}
			},
			{
				"box" : {
					"id" : "obj-comment-stage1",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 200.0, 510.0, 200.0, 20.0 ],
					"text" : "Stage 1: Read 1D matrix"
				}
			},
			{
				"box" : {
					"id" : "obj-ram-read",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "jit_matrix", "" ],
					"patching_rect" : [ 50.0, 530.0, 220.0, 22.0 ],
					"text" : "jit.matrix tv_viz_ram 4 float32 65536"
				}
			},
			{
				"box" : {
					"id" : "obj-comment-stage2",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 200.0, 570.0, 200.0, 20.0 ],
					"text" : "Stage 2: Reshape to 2D (256x256)"
				}
			},
			{
				"box" : {
					"id" : "obj-reshape-2d",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "jit_matrix", "" ],
					"patching_rect" : [ 50.0, 590.0, 200.0, 22.0 ],
					"text" : "jit.matrix 4 float32 256 256 @adapt 0"
				}
			},
			{
				"box" : {
					"id" : "obj-comment-stage3",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 200.0, 630.0, 400.0, 20.0 ],
					"text" : "Stage 3: Unified GPU Shader (All geometry + artifact effects)"
				}
			},
			{
				"box" : {
					"id" : "obj-gen",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "jit_matrix", "" ],
					"patching_rect" : [ 50.0, 650.0, 45.0, 22.0 ],
					"text" : "jit.gen",
					"patcher" : {
						"fileversion" : 1,
						"appversion" : {
							"major" : 8,
							"minor" : 6,
							"revision" : 0,
							"architecture" : "x64",
							"modernui" : 1
						},
						"classnamespace" : "jit.gen",
						"rect" : [ 100.0, 100.0, 600.0, 400.0 ],
						"boxes" : [
							{
								"box" : {
									"id" : "obj-in1",
									"maxclass" : "newobj",
									"patching_rect" : [ 50.0, 30.0, 30.0, 22.0 ],
									"text" : "in 1"
								}
							},
							{
								"box" : {
									"id" : "obj-codebox",
									"maxclass" : "codebox",
									"patching_rect" : [ 50.0, 70.0, 400.0, 200.0 ],
									"code" : "out1 = in1;"
								}
							},
							{
								"box" : {
									"id" : "obj-out1",
									"maxclass" : "newobj",
									"patching_rect" : [ 50.0, 290.0, 35.0, 22.0 ],
									"text" : "out 1"
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
									"destination" : [ "obj-out1", 0 ],
									"source" : [ "obj-codebox", 0 ]
								}
							}
						]
					}
				}
			},
			{
				"box" : {
					"id" : "obj-comment-stage4",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 200.0, 690.0, 250.0, 20.0 ],
					"text" : "Stage 4: Colorize ARGB planes for display"
				}
			},
			{
				"box" : {
					"id" : "obj-colorize",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "jit_matrix", "" ],
					"patching_rect" : [ 50.0, 710.0, 45.0, 22.0 ],
					"text" : "jit.gen",
					"patcher" : {
						"fileversion" : 1,
						"appversion" : {
							"major" : 8,
							"minor" : 6,
							"revision" : 0,
							"architecture" : "x64",
							"modernui" : 1
						},
						"classnamespace" : "jit.gen",
						"rect" : [ 100.0, 100.0, 600.0, 400.0 ],
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
									"id" : "obj-codebox",
									"maxclass" : "codebox",
									"numinlets" : 1,
									"numoutlets" : 1,
									"outlettype" : [ "" ],
									"patching_rect" : [ 50.0, 70.0, 500.0, 250.0 ],
									"code" : "// Colorize ARGB planes for vibrant display\n// Boost all planes and output\n\na = abs(in1.x) * 3.;\nr = abs(in1.y) * 5.;\ng = abs(in1.z) * 10.;\nb = abs(in1.w) * 5.;\n\n// Cross-modulation for color mixing\nr = r + g * 0.3;\nb = b + a * 0.5;\n\n// Clamp\na = clamp(a, 0., 1.);\nr = clamp(r, 0., 1.);\ng = clamp(g, 0., 1.);\nb = clamp(b, 0., 1.);\n\nout1 = vec(a, r, g, b);"
								}
							},
							{
								"box" : {
									"id" : "obj-out1",
									"maxclass" : "newobj",
									"numinlets" : 1,
									"numoutlets" : 0,
									"patching_rect" : [ 50.0, 340.0, 35.0, 22.0 ],
									"text" : "out 1"
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
									"destination" : [ "obj-out1", 0 ],
									"source" : [ "obj-codebox", 0 ]
								}
							}
						]
					}
				}
			}
		],
		"lines" : [
			{
				"patchline" : {
					"destination" : [ "obj-trigger", 0 ],
					"source" : [ "obj-inlet", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ram-read", 0 ],
					"source" : [ "obj-trigger", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scroll-store", 0 ],
					"source" : [ "obj-trigger", 1 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-zoom-store", 0 ],
					"source" : [ "obj-trigger", 2 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-rotation-store", 0 ],
					"source" : [ "obj-trigger", 3 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-store", 0 ],
					"source" : [ "obj-trigger", 4 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-edge-store", 0 ],
					"source" : [ "obj-trigger", 5 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-warp-store", 0 ],
					"source" : [ "obj-trigger", 6 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scrub-store", 0 ],
					"source" : [ "obj-trigger", 7 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-mosaic-store", 0 ],
					"source" : [ "obj-trigger", 8 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberration-store", 0 ],
					"source" : [ "obj-trigger", 9 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-bloom-store", 0 ],
					"source" : [ "obj-trigger", 10 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solarize-store", 0 ],
					"source" : [ "obj-trigger", 11 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-crush-store", 0 ],
					"source" : [ "obj-trigger", 12 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-store", 0 ],
					"source" : [ "obj-trigger", 13 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghosting-store", 0 ],
					"source" : [ "obj-trigger", 14 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scroll-store", 1 ],
					"source" : [ "obj-r-scroll", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scroll-prepend", 0 ],
					"source" : [ "obj-scroll-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-zoom-store", 1 ],
					"source" : [ "obj-r-zoom", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-zoom-scale", 0 ],
					"source" : [ "obj-zoom-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-zoom-prepend", 0 ],
					"source" : [ "obj-zoom-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-rotation-store", 1 ],
					"source" : [ "obj-r-rotation", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-rotation-scale", 0 ],
					"source" : [ "obj-rotation-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-rotation-prepend", 0 ],
					"source" : [ "obj-rotation-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-store", 1 ],
					"source" : [ "obj-r-smear", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-prepend", 0 ],
					"source" : [ "obj-smear-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-edge-store", 1 ],
					"source" : [ "obj-r-edge", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-edge-prepend", 0 ],
					"source" : [ "obj-edge-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-warp-store", 1 ],
					"source" : [ "obj-r-warp", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-warp-scale", 0 ],
					"source" : [ "obj-warp-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-warp-prepend-x", 0 ],
					"order" : 1,
					"source" : [ "obj-warp-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-warp-prepend-y", 0 ],
					"order" : 0,
					"source" : [ "obj-warp-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scrub-store", 1 ],
					"source" : [ "obj-r-scrub", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scrub-prepend", 0 ],
					"source" : [ "obj-scrub-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-mosaic-store", 1 ],
					"source" : [ "obj-r-mosaic", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-mosaic-scale", 0 ],
					"source" : [ "obj-mosaic-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-mosaic-prepend", 0 ],
					"source" : [ "obj-mosaic-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberration-store", 1 ],
					"source" : [ "obj-r-aberration", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberration-scale", 0 ],
					"source" : [ "obj-aberration-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberration-prepend", 0 ],
					"source" : [ "obj-aberration-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-bloom-store", 1 ],
					"source" : [ "obj-r-bloom", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-bloom-prepend", 0 ],
					"source" : [ "obj-bloom-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solarize-store", 1 ],
					"source" : [ "obj-r-solarize", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solarize-prepend", 0 ],
					"source" : [ "obj-solarize-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-crush-store", 1 ],
					"source" : [ "obj-r-crush", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-crush-scale", 0 ],
					"source" : [ "obj-crush-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-crush-prepend", 0 ],
					"source" : [ "obj-crush-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-store", 1 ],
					"source" : [ "obj-r-shutter", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-prepend", 0 ],
					"source" : [ "obj-shutter-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghosting-store", 1 ],
					"source" : [ "obj-r-ghosting", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghosting-scale", 0 ],
					"source" : [ "obj-ghosting-store", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghosting-prepend", 0 ],
					"source" : [ "obj-ghosting-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-reshape-2d", 0 ],
					"source" : [ "obj-ram-read", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-gen", 0 ],
					"source" : [ "obj-reshape-2d", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-colorize", 0 ],
					"source" : [ "obj-gen", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-outlet", 0 ],
					"source" : [ "obj-colorize", 0 ]
				}
			}
		]
	}
}
