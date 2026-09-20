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
		"rect" : [ 100.0, 100.0, 900.0, 700.0 ],
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
		"description" : "tv.param v8 - Twin Engine Parameter Router (Parallel Processing)",
		"digest" : "Routes parameters to both audio engine and visualization paths",
		"tags" : "teevee, param, parameters, dual-path, twin-engine",
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
					"patching_rect" : [ 600.0, 20.0, 350.0, 20.0 ],
					"text" : "tv.param v8 - Twin Engine Parameter Router (Parallel Processing)"
				}
			},
			{
				"box" : {
					"id" : "obj-audio-label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 280.0, 200.0, 20.0 ],
					"text" : "=== Path A: Audio Engine (MSP) ==="
				}
			},
			{
				"box" : {
					"id" : "obj-viz-label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 600.0, 280.0, 220.0, 20.0 ],
					"text" : "=== Path B: Visualization (Jitter) ==="
				}
			},
			{
				"box" : {
					"id" : "obj-geometry-label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 60.0, 150.0, 20.0 ],
					"text" : "=== GEOMETRY ==="
				}
			},
			{
				"box" : {
					"id" : "obj-texture-label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 300.0, 60.0, 150.0, 20.0 ],
					"text" : "=== TEXTURE ==="
				}
			},
			{
				"box" : {
					"id" : "obj-space-label",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 750.0, 60.0, 150.0, 20.0 ],
					"text" : "=== SPACE ==="
				}
			},
			{
				"box" : {
					"comment" : "Scroll (0-1) - Geometry",
					"id" : "obj-in-scroll",
					"index" : 1,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 50.0, 90.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Zoom (0-1) - Geometry",
					"id" : "obj-in-zoom",
					"index" : 2,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 100.0, 90.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Rotation (0-1) - Geometry",
					"id" : "obj-in-rotation",
					"index" : 3,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 150.0, 90.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Mosaic (0-1) - Texture",
					"id" : "obj-in-mosaic",
					"index" : 4,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 90.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Aberration (0-1) - Texture",
					"id" : "obj-in-aberration",
					"index" : 5,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 350.0, 90.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Bloom (0-1) - Texture",
					"id" : "obj-in-bloom",
					"index" : 6,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 400.0, 90.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Solarize (0-1) - Texture",
					"id" : "obj-in-solarize",
					"index" : 7,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 450.0, 90.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Crush (0-1) - Texture",
					"id" : "obj-in-crush",
					"index" : 8,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 500.0, 90.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Shutter (0-1) - Space",
					"id" : "obj-in-shutter",
					"index" : 9,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 750.0, 90.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Ghosting (0-1) - Space",
					"id" : "obj-in-ghosting",
					"index" : 10,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 800.0, 90.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Smear (0-1) - Space",
					"id" : "obj-in-smear",
					"index" : 11,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 850.0, 90.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Freeze (0-1) - State",
					"id" : "obj-in-freeze",
					"index" : 12,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1000.0, 90.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-scale-scroll-audio",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 50.0, 140.0, 140.0, 22.0 ],
					"text" : "scale 0. 1. 0. 1000."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-zoom-audio",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 100.0, 180.0, 120.0, 22.0 ],
					"text" : "scale 0. 1. 0.5 2."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-rotate-audio",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 150.0, 140.0, 135.0, 22.0 ],
					"text" : "scale 0. 1. -500. 500."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-mosaic-audio",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 140.0, 130.0, 22.0 ],
					"text" : "scale 0. 1. 1. 0.05"
				}
			},
			{
				"box" : {
					"id" : "obj-scale-aberration-audio",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 350.0, 180.0, 120.0, 22.0 ],
					"text" : "scale 0. 1. 0. 40."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-bloom-audio",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 400.0, 140.0, 110.0, 22.0 ],
					"text" : "scale 0. 1. 1. 8."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-solarize-audio",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 450.0, 180.0, 100.0, 22.0 ],
					"text" : "scale 0. 1. 0. 1."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-crush-audio",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 500.0, 140.0, 120.0, 22.0 ],
					"text" : "scale 0. 1. 24. 4."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-shutter-audio",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 750.0, 140.0, 120.0, 22.0 ],
					"text" : "scale 0. 1. 0. 20."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-ghosting-audio",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 800.0, 180.0, 125.0, 22.0 ],
					"text" : "scale 0. 1. 0. 0.8"
				}
			},
			{
				"box" : {
					"id" : "obj-scale-smear-audio",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 850.0, 140.0, 100.0, 22.0 ],
					"text" : "scale 0. 1. 0. 1."
				}
			},
			{
				"box" : {
					"id" : "obj-s-audio-scroll",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 320.0, 125.0, 22.0 ],
					"text" : "s ---tv_audio_scroll"
				}
			},
			{
				"box" : {
					"id" : "obj-s-audio-zoom",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 100.0, 360.0, 120.0, 22.0 ],
					"text" : "s ---tv_audio_zoom"
				}
			},
			{
				"box" : {
					"id" : "obj-s-audio-rotate",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 150.0, 320.0, 125.0, 22.0 ],
					"text" : "s ---tv_audio_rotate"
				}
			},
			{
				"box" : {
					"id" : "obj-s-audio-mosaic",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 300.0, 320.0, 125.0, 22.0 ],
					"text" : "s ---tv_audio_mosaic"
				}
			},
			{
				"box" : {
					"id" : "obj-s-audio-aberration",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 350.0, 360.0, 145.0, 22.0 ],
					"text" : "s ---tv_audio_aberration"
				}
			},
			{
				"box" : {
					"id" : "obj-s-audio-bloom",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 400.0, 320.0, 120.0, 22.0 ],
					"text" : "s ---tv_audio_bloom"
				}
			},
			{
				"box" : {
					"id" : "obj-s-audio-solarize",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 450.0, 360.0, 130.0, 22.0 ],
					"text" : "s ---tv_audio_solarize"
				}
			},
			{
				"box" : {
					"id" : "obj-s-audio-crush",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 500.0, 320.0, 120.0, 22.0 ],
					"text" : "s ---tv_audio_crush"
				}
			},
			{
				"box" : {
					"id" : "obj-s-audio-shutter",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 750.0, 320.0, 125.0, 22.0 ],
					"text" : "s ---tv_audio_shutter"
				}
			},
			{
				"box" : {
					"id" : "obj-s-audio-ghosting",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 800.0, 360.0, 135.0, 22.0 ],
					"text" : "s ---tv_audio_ghosting"
				}
			},
			{
				"box" : {
					"id" : "obj-s-audio-smear",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 850.0, 320.0, 125.0, 22.0 ],
					"text" : "s ---tv_audio_smear"
				}
			},
			{
				"box" : {
					"id" : "obj-s-audio-freeze",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1000.0, 320.0, 125.0, 22.0 ],
					"text" : "s ---tv_audio_freeze"
				}
			},
			{
				"box" : {
					"id" : "obj-s-viz-freeze",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1000.0, 350.0, 125.0, 22.0 ],
					"text" : "s tv_param_freeze"
				}
			},
			{
				"box" : {
					"id" : "obj-scale-scroll-viz",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 600.0, 140.0, 110.0, 22.0 ],
					"text" : "scale 0. 1. 0. 1."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-zoom-viz",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 650.0, 180.0, 110.0, 22.0 ],
					"text" : "scale 0. 1. 0.5 2."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-rotation-viz",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 700.0, 140.0, 165.0, 22.0 ],
					"text" : "scale 0. 1. -3.14159 3.14159"
				}
			},
			{
				"box" : {
					"id" : "obj-scale-mosaic-viz",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 950.0, 140.0, 140.0, 22.0 ],
					"text" : "scale 0. 1. 2048. 10."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-aberration-viz",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1000.0, 180.0, 130.0, 22.0 ],
					"text" : "scale 0. 1. 0. 0.05"
				}
			},
			{
				"box" : {
					"id" : "obj-scale-bloom-viz",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1050.0, 140.0, 110.0, 22.0 ],
					"text" : "scale 0. 1. 0. 1."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-solarize-viz",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1100.0, 180.0, 110.0, 22.0 ],
					"text" : "scale 0. 1. 0. 1."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-crush-viz",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1150.0, 140.0, 130.0, 22.0 ],
					"text" : "scale 0. 1. 255. 2."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-shutter-viz",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1400.0, 140.0, 120.0, 22.0 ],
					"text" : "scale 0. 1. 0. 20."
				}
			},
			{
				"box" : {
					"id" : "obj-scale-ghosting-viz",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1450.0, 180.0, 125.0, 22.0 ],
					"text" : "scale 0. 1. 0. 0.5"
				}
			},
			{
				"box" : {
					"id" : "obj-scale-smear-viz",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1500.0, 140.0, 125.0, 22.0 ],
					"text" : "scale 0. 1. 0. 0.95"
				}
			},
			{
				"box" : {
					"id" : "obj-s-viz-scroll",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 600.0, 320.0, 125.0, 22.0 ],
					"text" : "s ---tv_param_scroll"
				}
			},
			{
				"box" : {
					"id" : "obj-s-viz-zoom",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 650.0, 360.0, 115.0, 22.0 ],
					"text" : "s ---tv_param_zoom"
				}
			},
			{
				"box" : {
					"id" : "obj-s-viz-rotation",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 700.0, 320.0, 125.0, 22.0 ],
					"text" : "s ---tv_param_rotation"
				}
			},
			{
				"box" : {
					"id" : "obj-s-viz-mosaic",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 950.0, 320.0, 125.0, 22.0 ],
					"text" : "s ---tv_param_mosaic"
				}
			},
			{
				"box" : {
					"id" : "obj-s-viz-aberration",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1000.0, 360.0, 145.0, 22.0 ],
					"text" : "s ---tv_param_aberration"
				}
			},
			{
				"box" : {
					"id" : "obj-s-viz-bloom",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1050.0, 320.0, 120.0, 22.0 ],
					"text" : "s ---tv_param_bloom"
				}
			},
			{
				"box" : {
					"id" : "obj-s-viz-solarize",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1100.0, 360.0, 130.0, 22.0 ],
					"text" : "s ---tv_param_solarize"
				}
			},
			{
				"box" : {
					"id" : "obj-s-viz-crush",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1150.0, 320.0, 115.0, 22.0 ],
					"text" : "s ---tv_param_crush"
				}
			},
			{
				"box" : {
					"id" : "obj-s-viz-shutter",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1400.0, 320.0, 125.0, 22.0 ],
					"text" : "s ---tv_param_shutter"
				}
			},
			{
				"box" : {
					"id" : "obj-s-viz-ghosting",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1450.0, 360.0, 130.0, 22.0 ],
					"text" : "s ---tv_param_ghosting"
				}
			},
			{
				"box" : {
					"id" : "obj-s-viz-smear",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1500.0, 320.0, 120.0, 22.0 ],
					"text" : "s ---tv_param_smear"
				}
			},
			{
				"box" : {
					"id" : "obj-dim-inlet",
					"comment" : "Matrix Dimension",
					"index" : 13,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 1650.0, 90.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-s-dim",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 1650.0, 320.0, 80.0, 22.0 ],
					"text" : "s ---tv_dim"
				}
			}
		],
		"lines" : [
			{
				"patchline" : {
					"destination" : [ "obj-scale-scroll-audio", 0 ],
					"source" : [ "obj-in-scroll", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-scroll-viz", 0 ],
					"source" : [ "obj-in-scroll", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-zoom-audio", 0 ],
					"source" : [ "obj-in-zoom", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-zoom-viz", 0 ],
					"source" : [ "obj-in-zoom", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-rotate-audio", 0 ],
					"source" : [ "obj-in-rotation", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-rotation-viz", 0 ],
					"source" : [ "obj-in-rotation", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-mosaic-audio", 0 ],
					"source" : [ "obj-in-mosaic", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-mosaic-viz", 0 ],
					"source" : [ "obj-in-mosaic", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-aberration-audio", 0 ],
					"source" : [ "obj-in-aberration", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-aberration-viz", 0 ],
					"source" : [ "obj-in-aberration", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-bloom-audio", 0 ],
					"source" : [ "obj-in-bloom", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-bloom-viz", 0 ],
					"source" : [ "obj-in-bloom", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-solarize-audio", 0 ],
					"source" : [ "obj-in-solarize", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-solarize-viz", 0 ],
					"source" : [ "obj-in-solarize", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-crush-audio", 0 ],
					"source" : [ "obj-in-crush", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-crush-viz", 0 ],
					"source" : [ "obj-in-crush", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-shutter-audio", 0 ],
					"source" : [ "obj-in-shutter", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-shutter-viz", 0 ],
					"source" : [ "obj-in-shutter", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-ghosting-audio", 0 ],
					"source" : [ "obj-in-ghosting", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-ghosting-viz", 0 ],
					"source" : [ "obj-in-ghosting", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-smear-audio", 0 ],
					"source" : [ "obj-in-smear", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scale-smear-viz", 0 ],
					"source" : [ "obj-in-smear", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-audio-freeze", 0 ],
					"order" : 1,
					"source" : [ "obj-in-freeze", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-viz-freeze", 0 ],
					"order" : 0,
					"source" : [ "obj-in-freeze", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-audio-scroll", 0 ],
					"source" : [ "obj-scale-scroll-audio", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-audio-zoom", 0 ],
					"source" : [ "obj-scale-zoom-audio", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-audio-rotate", 0 ],
					"source" : [ "obj-scale-rotate-audio", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-audio-mosaic", 0 ],
					"source" : [ "obj-scale-mosaic-audio", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-audio-aberration", 0 ],
					"source" : [ "obj-scale-aberration-audio", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-audio-bloom", 0 ],
					"source" : [ "obj-scale-bloom-audio", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-audio-solarize", 0 ],
					"source" : [ "obj-scale-solarize-audio", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-audio-crush", 0 ],
					"source" : [ "obj-scale-crush-audio", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-audio-shutter", 0 ],
					"source" : [ "obj-scale-shutter-audio", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-audio-ghosting", 0 ],
					"source" : [ "obj-scale-ghosting-audio", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-audio-smear", 0 ],
					"source" : [ "obj-scale-smear-audio", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-viz-scroll", 0 ],
					"source" : [ "obj-scale-scroll-viz", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-viz-zoom", 0 ],
					"source" : [ "obj-scale-zoom-viz", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-viz-rotation", 0 ],
					"source" : [ "obj-scale-rotation-viz", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-viz-mosaic", 0 ],
					"source" : [ "obj-scale-mosaic-viz", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-viz-aberration", 0 ],
					"source" : [ "obj-scale-aberration-viz", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-viz-bloom", 0 ],
					"source" : [ "obj-scale-bloom-viz", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-viz-solarize", 0 ],
					"source" : [ "obj-scale-solarize-viz", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-viz-crush", 0 ],
					"source" : [ "obj-scale-crush-viz", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-viz-shutter", 0 ],
					"source" : [ "obj-scale-shutter-viz", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-viz-ghosting", 0 ],
					"source" : [ "obj-scale-ghosting-viz", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-viz-smear", 0 ],
					"source" : [ "obj-scale-smear-viz", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-s-dim", 0 ],
					"source" : [ "obj-dim-inlet", 0 ]
				}
			}
		]
	}
}
