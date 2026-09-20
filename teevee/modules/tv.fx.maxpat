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
		"rect" : [ 100.0, 100.0, 1200.0, 800.0 ],
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
		"description" : "tv.fx - All Effects Chain",
		"digest" : "Mosaic, Aberration, Bloom, Solarize, Crush, Shutter, Ghosting, Smear",
		"tags" : "teevee, fx, effects",
		"style" : "",
		"subpatcher_template" : "",
		"assistshowspatchername" : 0,
		"boxes" : [
			{
				"box" : {
					"comment" : "Audio In L",
					"id" : "obj-in-l",
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
					"comment" : "Audio In R",
					"id" : "obj-in-r",
					"index" : 2,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 30.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"id" : "obj-title",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 400.0, 30.0, 300.0, 20.0 ],
					"text" : "tv.fx - Full Effects Chain"
				}
			},
			{
				"box" : {
					"id" : "obj-r-mosaic",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 400.0, 60.0, 115.0, 22.0 ],
					"text" : "r ---tv_audio_mosaic"
				}
			},
			{
				"box" : {
					"id" : "obj-r-aberration",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 520.0, 60.0, 130.0, 22.0 ],
					"text" : "r ---tv_audio_aberration"
				}
			},
			{
				"box" : {
					"id" : "obj-r-bloom",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 660.0, 60.0, 110.0, 22.0 ],
					"text" : "r ---tv_audio_bloom"
				}
			},
			{
				"box" : {
					"id" : "obj-r-solarize",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 780.0, 60.0, 120.0, 22.0 ],
					"text" : "r ---tv_audio_solarize"
				}
			},
			{
				"box" : {
					"id" : "obj-r-crush",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 400.0, 90.0, 110.0, 22.0 ],
					"text" : "r ---tv_audio_crush"
				}
			},
			{
				"box" : {
					"id" : "obj-r-shutter",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 520.0, 90.0, 115.0, 22.0 ],
					"text" : "r ---tv_audio_shutter"
				}
			},
			{
				"box" : {
					"id" : "obj-r-ghosting",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 660.0, 90.0, 120.0, 22.0 ],
					"text" : "r ---tv_audio_ghosting"
				}
			},
			{
				"box" : {
					"id" : "obj-r-smear",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 780.0, 90.0, 110.0, 22.0 ],
					"text" : "r ---tv_audio_smear"
				}
			},
			{
				"box" : {
					"id" : "obj-mosaic-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 400.0, 130.0, 55.0, 22.0 ],
					"text" : "line~ 1 20"
				}
			},
			{
				"box" : {
					"id" : "obj-aberration-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 520.0, 130.0, 55.0, 22.0 ],
					"text" : "line~ 0 20"
				}
			},
			{
				"box" : {
					"id" : "obj-bloom-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 660.0, 130.0, 55.0, 22.0 ],
					"text" : "line~ 1 20"
				}
			},
			{
				"box" : {
					"id" : "obj-solarize-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 780.0, 130.0, 55.0, 22.0 ],
					"text" : "line~ 0 20"
				}
			},
			{
				"box" : {
					"id" : "obj-crush-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 400.0, 160.0, 60.0, 22.0 ],
					"text" : "line~ 24 20"
				}
			},
			{
				"box" : {
					"id" : "obj-shutter-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 520.0, 160.0, 55.0, 22.0 ],
					"text" : "line~ 0 20"
				}
			},
			{
				"box" : {
					"id" : "obj-ghosting-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 660.0, 160.0, 55.0, 22.0 ],
					"text" : "line~ 0 20"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 780.0, 160.0, 55.0, 22.0 ],
					"text" : "line~ 0 20"
				}
			},
			{
				"box" : {
					"id" : "obj-label-mosaic",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 70.0, 150.0, 20.0 ],
					"text" : "Stage 1: Mosaic (degrade~)"
				}
			},
			{
				"box" : {
					"id" : "obj-degrade-l",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 100.0, 95.0, 22.0 ],
					"text" : "degrade~ 1. 24"
				}
			},
			{
				"box" : {
					"id" : "obj-degrade-r",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 100.0, 95.0, 22.0 ],
					"text" : "degrade~ 1. 24"
				}
			},
			{
				"box" : {
					"id" : "obj-label-aberr",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 140.0, 280.0, 20.0 ],
					"text" : "Stage 2: Aberration (3-band crossover + micro-delays)"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-lo-l",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 170.0, 85.0, 22.0 ],
					"text" : "lores~ 300 0.5"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-lo-r",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 170.0, 85.0, 22.0 ],
					"text" : "lores~ 300 0.5"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-mid-lp-l",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 200.0, 95.0, 22.0 ],
					"text" : "lores~ 3000 0.5"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-mid-lp-r",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 200.0, 95.0, 22.0 ],
					"text" : "lores~ 3000 0.5"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-mid-hp-l",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 230.0, 85.0, 22.0 ],
					"text" : "reson~ 1700 3000 1"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-mid-hp-r",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 230.0, 85.0, 22.0 ],
					"text" : "reson~ 1700 3000 1"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-hi-hp-l",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 260.0, 95.0, 22.0 ],
					"text" : "reson~ 8000 12000 1"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-hi-hp-r",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 260.0, 95.0, 22.0 ],
					"text" : "reson~ 8000 12000 1"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-tapin-mid-l",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "tapconnect" ],
					"patching_rect" : [ 50.0, 290.0, 80.0, 22.0 ],
					"text" : "tapin~ 100"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-tapin-mid-r",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "tapconnect" ],
					"patching_rect" : [ 150.0, 290.0, 80.0, 22.0 ],
					"text" : "tapin~ 100"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-tapin-hi-l",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "tapconnect" ],
					"patching_rect" : [ 250.0, 290.0, 80.0, 22.0 ],
					"text" : "tapin~ 100"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-tapin-hi-r",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "tapconnect" ],
					"patching_rect" : [ 350.0, 290.0, 80.0, 22.0 ],
					"text" : "tapin~ 100"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-tap-mid-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 320.0, 65.0, 22.0 ],
					"text" : "tapout~ 1"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-tap-mid-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 320.0, 65.0, 22.0 ],
					"text" : "tapout~ 1"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-tap-hi-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 250.0, 320.0, 65.0, 22.0 ],
					"text" : "tapout~ 1"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-tap-hi-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 350.0, 320.0, 65.0, 22.0 ],
					"text" : "tapout~ 1"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-mid-scale",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 520.0, 200.0, 110.0, 22.0 ],
					"text" : "scale~ 0. 1. 0. 20."
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-hi-scale",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 640.0, 200.0, 110.0, 22.0 ],
					"text" : "scale~ 0. 1. 0. 40."
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-mid-snap",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 520.0, 235.0, 75.0, 22.0 ],
					"text" : "snapshot~ 50"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-hi-snap",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 640.0, 235.0, 75.0, 22.0 ],
					"text" : "snapshot~ 50"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-metro",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 760.0, 165.0, 65.0, 22.0 ],
					"text" : "metro 50"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-loadbang",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 760.0, 130.0, 58.0, 22.0 ],
					"text" : "loadbang"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-start",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 760.0, 145.0, 22.0, 22.0 ],
					"text" : "t 1"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-sum-l",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 360.0, 50.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-aberr-sum-r",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 360.0, 50.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-label-bloom",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 400.0, 180.0, 20.0 ],
					"text" : "Stage 3: Bloom (soft saturation)"
				}
			},
			{
				"box" : {
					"id" : "obj-bloom-drive-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 430.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-bloom-drive-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 430.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-bloom-sat-l",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 460.0, 40.0, 22.0 ],
					"text" : "tanh~"
				}
			},
			{
				"box" : {
					"id" : "obj-bloom-sat-r",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 460.0, 40.0, 22.0 ],
					"text" : "tanh~"
				}
			},
			{
				"box" : {
					"id" : "obj-label-solar",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 500.0, 250.0, 20.0 ],
					"text" : "Stage 4: Solarize (true wavefolding)"
				}
			},
			{
				"box" : {
					"id" : "obj-solar-drive",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 300.0, 520.0, 100.0, 22.0 ],
					"text" : "scale~ 0. 1. 1. 8."
				}
			},
			{
				"box" : {
					"id" : "obj-solar-boost-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 520.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-solar-boost-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 520.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-solar-sin-l",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 550.0, 80.0, 22.0 ],
					"text" : "gen~ sin(in1)"
				}
			},
			{
				"box" : {
					"id" : "obj-solar-sin-r",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 550.0, 80.0, 22.0 ],
					"text" : "gen~ sin(in1)"
				}
			},
			{
				"box" : {
					"id" : "obj-solar-inv",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 300.0, 600.0, 45.0, 22.0 ],
					"text" : "!-~ 1."
				}
			},
			{
				"box" : {
					"id" : "obj-solar-wet-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 580.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-solar-wet-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 580.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-solar-dry-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 610.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-solar-dry-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 610.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-solar-mix-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 640.0, 30.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-solar-mix-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 640.0, 30.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-label-crush",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 680.0, 180.0, 20.0 ],
					"text" : "Stage 5: Crush (bit reduction)"
				}
			},
			{
				"box" : {
					"id" : "obj-crush-l",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 710.0, 95.0, 22.0 ],
					"text" : "degrade~ 1. 24"
				}
			},
			{
				"box" : {
					"id" : "obj-crush-r",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 710.0, 95.0, 22.0 ],
					"text" : "degrade~ 1. 24"
				}
			},
			{
				"box" : {
					"id" : "obj-label-shutter",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 750.0, 180.0, 20.0 ],
					"text" : "Stage 6: Shutter (tremolo)"
				}
			},
			{
				"box" : {
					"id" : "obj-shutter-rate",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 300.0, 750.0, 115.0, 22.0 ],
					"text" : "scale~ 0. 20. 0.1 30."
				}
			},
			{
				"box" : {
					"id" : "obj-shutter-lfo",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 300.0, 780.0, 80.0, 22.0 ],
					"text" : "rect~ 1"
				}
			},
			{
				"box" : {
					"id" : "obj-shutter-bypass",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 300.0, 810.0, 50.0, 22.0 ],
					"text" : ">=~ 0.01"
				}
			},
			{
				"box" : {
					"id" : "obj-shutter-addone",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 300.0, 840.0, 40.0, 22.0 ],
					"text" : "+~ 1"
				}
			},
			{
				"box" : {
					"id" : "obj-shutter-sel",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 300.0, 870.0, 80.0, 22.0 ],
					"text" : "selector~ 2 1"
				}
			},
			{
				"box" : {
					"id" : "obj-shutter-one",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 350.0, 810.0, 40.0, 22.0 ],
					"text" : "sig~ 1"
				}
			},
			{
				"box" : {
					"id" : "obj-shutter-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 870.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-shutter-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 870.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-label-ghosting",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 910.0, 220.0, 20.0 ],
					"text" : "Stage 7: Ghosting (slapback delay)"
				}
			},
			{
				"box" : {
					"id" : "obj-ghost-tapin-l",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "tapconnect" ],
					"patching_rect" : [ 50.0, 940.0, 70.0, 22.0 ],
					"text" : "tapin~ 50"
				}
			},
			{
				"box" : {
					"id" : "obj-ghost-tapin-r",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "tapconnect" ],
					"patching_rect" : [ 150.0, 940.0, 70.0, 22.0 ],
					"text" : "tapin~ 50"
				}
			},
			{
				"box" : {
					"id" : "obj-ghost-tap-l",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 970.0, 70.0, 22.0 ],
					"text" : "tapout~ 20"
				}
			},
			{
				"box" : {
					"id" : "obj-ghost-tap-r",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 970.0, 70.0, 22.0 ],
					"text" : "tapout~ 20"
				}
			},
			{
				"box" : {
					"id" : "obj-ghost-fb-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 1000.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-ghost-fb-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 1000.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-ghost-mix-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 1030.0, 30.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-ghost-mix-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 1030.0, 30.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-label-smear",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 880.0, 300.0, 20.0 ],
					"text" : "Stage 8: Smear (4-tap FDN reverb with feedback)"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-fb-scale",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 300.0, 880.0, 110.0, 22.0 ],
					"text" : "scale~ 0. 1. 0. 0.85"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-lpf-scale",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 420.0, 880.0, 140.0, 22.0 ],
					"text" : "scale~ 0. 1. 18000. 2000."
				}
			},
			{
				"box" : {
					"id" : "obj-smear-tapin-l1",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "tapconnect" ],
					"patching_rect" : [ 50.0, 910.0, 85.0, 22.0 ],
					"text" : "tapin~ 2000"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-tapin-r1",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "tapconnect" ],
					"patching_rect" : [ 150.0, 910.0, 85.0, 22.0 ],
					"text" : "tapin~ 2000"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-tap-l1",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "signal", "signal", "signal", "signal" ],
					"patching_rect" : [ 50.0, 940.0, 180.0, 22.0 ],
					"text" : "tapout~ 29 67 113 179"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-tap-r1",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 4,
					"outlettype" : [ "signal", "signal", "signal", "signal" ],
					"patching_rect" : [ 150.0, 970.0, 180.0, 22.0 ],
					"text" : "tapout~ 37 79 127 191"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-sum-l",
					"maxclass" : "newobj",
					"numinlets" : 4,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 1000.0, 80.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-sum-r",
					"maxclass" : "newobj",
					"numinlets" : 4,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 1030.0, 80.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-lpf-l",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 1060.0, 100.0, 22.0 ],
					"text" : "lores~ 10000 0.3"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-lpf-r",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 1090.0, 100.0, 22.0 ],
					"text" : "lores~ 10000 0.3"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-fb-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 1120.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-fb-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 1150.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-cross-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 1180.0, 30.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-cross-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 1210.0, 30.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-wet-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 1240.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-wet-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 1270.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-dry-inv",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 300.0, 1240.0, 45.0, 22.0 ],
					"text" : "!-~ 1."
				}
			},
			{
				"box" : {
					"id" : "obj-smear-dry-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 1300.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-dry-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 1330.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-out-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 1360.0, 30.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-out-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 1390.0, 30.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"comment" : "Audio Out L",
					"id" : "obj-out-l",
					"index" : 1,
					"maxclass" : "outlet",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 1440.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Audio Out R",
					"id" : "obj-out-r",
					"index" : 2,
					"maxclass" : "outlet",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 150.0, 1440.0, 30.0, 30.0 ]
				}
			}
		],
		"lines" : [
			{
				"patchline" : {
					"destination" : [ "obj-mosaic-line", 0 ],
					"source" : [ "obj-r-mosaic", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberration-line", 0 ],
					"source" : [ "obj-r-aberration", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-bloom-line", 0 ],
					"source" : [ "obj-r-bloom", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solarize-line", 0 ],
					"source" : [ "obj-r-solarize", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-crush-line", 0 ],
					"source" : [ "obj-r-crush", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-line", 0 ],
					"source" : [ "obj-r-shutter", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghosting-line", 0 ],
					"source" : [ "obj-r-ghosting", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-line", 0 ],
					"source" : [ "obj-r-smear", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-degrade-l", 0 ],
					"source" : [ "obj-in-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-degrade-r", 0 ],
					"source" : [ "obj-in-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-degrade-l", 1 ],
					"order" : 1,
					"source" : [ "obj-mosaic-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-degrade-r", 1 ],
					"order" : 0,
					"source" : [ "obj-mosaic-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-lo-l", 0 ],
					"order" : 2,
					"source" : [ "obj-degrade-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-mid-lp-l", 0 ],
					"order" : 1,
					"source" : [ "obj-degrade-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-hi-hp-l", 0 ],
					"order" : 0,
					"source" : [ "obj-degrade-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-lo-r", 0 ],
					"order" : 2,
					"source" : [ "obj-degrade-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-mid-lp-r", 0 ],
					"order" : 1,
					"source" : [ "obj-degrade-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-hi-hp-r", 0 ],
					"order" : 0,
					"source" : [ "obj-degrade-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-sum-l", 0 ],
					"source" : [ "obj-aberr-lo-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-sum-r", 0 ],
					"source" : [ "obj-aberr-lo-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-mid-hp-l", 0 ],
					"source" : [ "obj-aberr-mid-lp-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-mid-hp-r", 0 ],
					"source" : [ "obj-aberr-mid-lp-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-tapin-mid-l", 0 ],
					"source" : [ "obj-aberr-mid-hp-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-tapin-mid-r", 0 ],
					"source" : [ "obj-aberr-mid-hp-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-tapin-hi-l", 0 ],
					"source" : [ "obj-aberr-hi-hp-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-tapin-hi-r", 0 ],
					"source" : [ "obj-aberr-hi-hp-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-tap-mid-l", 0 ],
					"source" : [ "obj-aberr-tapin-mid-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-tap-mid-r", 0 ],
					"source" : [ "obj-aberr-tapin-mid-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-tap-hi-l", 0 ],
					"source" : [ "obj-aberr-tapin-hi-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-tap-hi-r", 0 ],
					"source" : [ "obj-aberr-tapin-hi-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-mid-scale", 0 ],
					"order" : 1,
					"source" : [ "obj-aberration-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-hi-scale", 0 ],
					"order" : 0,
					"source" : [ "obj-aberration-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-mid-snap", 0 ],
					"source" : [ "obj-aberr-mid-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-hi-snap", 0 ],
					"source" : [ "obj-aberr-hi-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-start", 0 ],
					"source" : [ "obj-aberr-loadbang", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-metro", 0 ],
					"source" : [ "obj-aberr-start", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-mid-snap", 1 ],
					"order" : 1,
					"source" : [ "obj-aberr-metro", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-hi-snap", 1 ],
					"order" : 0,
					"source" : [ "obj-aberr-metro", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-tap-mid-l", 1 ],
					"order" : 1,
					"source" : [ "obj-aberr-mid-snap", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-tap-mid-r", 1 ],
					"order" : 0,
					"source" : [ "obj-aberr-mid-snap", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-tap-hi-l", 1 ],
					"order" : 1,
					"source" : [ "obj-aberr-hi-snap", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-tap-hi-r", 1 ],
					"order" : 0,
					"source" : [ "obj-aberr-hi-snap", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-sum-l", 1 ],
					"source" : [ "obj-aberr-tap-mid-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-sum-r", 1 ],
					"source" : [ "obj-aberr-tap-mid-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-sum-l", 2 ],
					"source" : [ "obj-aberr-tap-hi-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-aberr-sum-r", 2 ],
					"source" : [ "obj-aberr-tap-hi-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-bloom-drive-l", 0 ],
					"source" : [ "obj-aberr-sum-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-bloom-drive-r", 0 ],
					"source" : [ "obj-aberr-sum-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-bloom-drive-l", 1 ],
					"order" : 1,
					"source" : [ "obj-bloom-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-bloom-drive-r", 1 ],
					"order" : 0,
					"source" : [ "obj-bloom-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-bloom-sat-l", 0 ],
					"source" : [ "obj-bloom-drive-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-bloom-sat-r", 0 ],
					"source" : [ "obj-bloom-drive-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-boost-l", 0 ],
					"order" : 1,
					"source" : [ "obj-bloom-sat-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-dry-l", 0 ],
					"order" : 0,
					"source" : [ "obj-bloom-sat-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-boost-r", 0 ],
					"order" : 1,
					"source" : [ "obj-bloom-sat-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-dry-r", 0 ],
					"order" : 0,
					"source" : [ "obj-bloom-sat-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-drive", 0 ],
					"source" : [ "obj-solarize-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-inv", 0 ],
					"order" : 1,
					"source" : [ "obj-solarize-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-wet-l", 1 ],
					"order" : 2,
					"source" : [ "obj-solarize-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-wet-r", 1 ],
					"order" : 0,
					"source" : [ "obj-solarize-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-boost-l", 1 ],
					"order" : 1,
					"source" : [ "obj-solar-drive", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-boost-r", 1 ],
					"order" : 0,
					"source" : [ "obj-solar-drive", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-sin-l", 0 ],
					"source" : [ "obj-solar-boost-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-sin-r", 0 ],
					"source" : [ "obj-solar-boost-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-wet-l", 0 ],
					"source" : [ "obj-solar-sin-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-wet-r", 0 ],
					"source" : [ "obj-solar-sin-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-dry-l", 1 ],
					"order" : 1,
					"source" : [ "obj-solar-inv", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-dry-r", 1 ],
					"order" : 0,
					"source" : [ "obj-solar-inv", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-mix-l", 0 ],
					"source" : [ "obj-solar-wet-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-mix-r", 0 ],
					"source" : [ "obj-solar-wet-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-mix-l", 1 ],
					"source" : [ "obj-solar-dry-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-solar-mix-r", 1 ],
					"source" : [ "obj-solar-dry-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-crush-l", 0 ],
					"source" : [ "obj-solar-mix-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-crush-r", 0 ],
					"source" : [ "obj-solar-mix-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-crush-l", 2 ],
					"order" : 1,
					"source" : [ "obj-crush-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-crush-r", 2 ],
					"order" : 0,
					"source" : [ "obj-crush-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-l", 0 ],
					"source" : [ "obj-crush-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-r", 0 ],
					"source" : [ "obj-crush-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-rate", 0 ],
					"order" : 0,
					"source" : [ "obj-shutter-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-bypass", 0 ],
					"order" : 1,
					"source" : [ "obj-shutter-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-lfo", 0 ],
					"source" : [ "obj-shutter-rate", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-sel", 2 ],
					"source" : [ "obj-shutter-lfo", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-addone", 0 ],
					"source" : [ "obj-shutter-bypass", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-sel", 0 ],
					"source" : [ "obj-shutter-addone", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-sel", 1 ],
					"source" : [ "obj-shutter-one", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-l", 1 ],
					"order" : 1,
					"source" : [ "obj-shutter-sel", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-shutter-r", 1 ],
					"order" : 0,
					"source" : [ "obj-shutter-sel", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghost-tapin-l", 0 ],
					"order" : 1,
					"source" : [ "obj-shutter-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghost-mix-l", 0 ],
					"order" : 0,
					"source" : [ "obj-shutter-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghost-tapin-r", 0 ],
					"order" : 1,
					"source" : [ "obj-shutter-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghost-mix-r", 0 ],
					"order" : 0,
					"source" : [ "obj-shutter-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghost-tap-l", 0 ],
					"source" : [ "obj-ghost-tapin-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghost-tap-r", 0 ],
					"source" : [ "obj-ghost-tapin-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghost-fb-l", 0 ],
					"source" : [ "obj-ghost-tap-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghost-fb-r", 0 ],
					"source" : [ "obj-ghost-tap-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghost-fb-l", 1 ],
					"order" : 1,
					"source" : [ "obj-ghosting-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghost-fb-r", 1 ],
					"order" : 0,
					"source" : [ "obj-ghosting-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghost-mix-l", 1 ],
					"source" : [ "obj-ghost-fb-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-ghost-mix-r", 1 ],
					"source" : [ "obj-ghost-fb-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-tapin-l1", 0 ],
					"order" : 1,
					"source" : [ "obj-ghost-mix-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-dry-l", 0 ],
					"order" : 0,
					"source" : [ "obj-ghost-mix-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-tapin-r1", 0 ],
					"order" : 1,
					"source" : [ "obj-ghost-mix-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-dry-r", 0 ],
					"order" : 0,
					"source" : [ "obj-ghost-mix-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-fb-scale", 0 ],
					"order" : 0,
					"source" : [ "obj-smear-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-lpf-scale", 0 ],
					"order" : 1,
					"source" : [ "obj-smear-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-wet-l", 1 ],
					"order" : 2,
					"source" : [ "obj-smear-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-wet-r", 1 ],
					"order" : 3,
					"source" : [ "obj-smear-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-dry-inv", 0 ],
					"order" : 4,
					"source" : [ "obj-smear-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-tap-l1", 0 ],
					"source" : [ "obj-smear-tapin-l1", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-tap-r1", 0 ],
					"source" : [ "obj-smear-tapin-r1", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-sum-l", 0 ],
					"source" : [ "obj-smear-tap-l1", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-sum-l", 1 ],
					"source" : [ "obj-smear-tap-l1", 1 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-sum-l", 2 ],
					"source" : [ "obj-smear-tap-l1", 2 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-sum-l", 3 ],
					"source" : [ "obj-smear-tap-l1", 3 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-sum-r", 0 ],
					"source" : [ "obj-smear-tap-r1", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-sum-r", 1 ],
					"source" : [ "obj-smear-tap-r1", 1 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-sum-r", 2 ],
					"source" : [ "obj-smear-tap-r1", 2 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-sum-r", 3 ],
					"source" : [ "obj-smear-tap-r1", 3 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-lpf-l", 0 ],
					"source" : [ "obj-smear-sum-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-lpf-r", 0 ],
					"source" : [ "obj-smear-sum-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-lpf-l", 1 ],
					"order" : 1,
					"source" : [ "obj-smear-lpf-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-lpf-r", 1 ],
					"order" : 0,
					"source" : [ "obj-smear-lpf-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-fb-l", 0 ],
					"source" : [ "obj-smear-lpf-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-fb-r", 0 ],
					"source" : [ "obj-smear-lpf-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-fb-l", 1 ],
					"order" : 1,
					"source" : [ "obj-smear-fb-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-fb-r", 1 ],
					"order" : 0,
					"source" : [ "obj-smear-fb-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-cross-l", 0 ],
					"source" : [ "obj-smear-fb-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-cross-r", 0 ],
					"source" : [ "obj-smear-fb-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-cross-r", 1 ],
					"source" : [ "obj-smear-fb-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-cross-l", 1 ],
					"source" : [ "obj-smear-fb-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-tapin-l1", 0 ],
					"source" : [ "obj-smear-cross-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-tapin-r1", 0 ],
					"source" : [ "obj-smear-cross-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-wet-l", 0 ],
					"source" : [ "obj-smear-lpf-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-wet-r", 0 ],
					"source" : [ "obj-smear-lpf-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-dry-l", 1 ],
					"order" : 1,
					"source" : [ "obj-smear-dry-inv", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-dry-r", 1 ],
					"order" : 0,
					"source" : [ "obj-smear-dry-inv", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-out-l", 0 ],
					"source" : [ "obj-smear-wet-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-out-r", 0 ],
					"source" : [ "obj-smear-wet-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-out-l", 1 ],
					"source" : [ "obj-smear-dry-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-smear-out-r", 1 ],
					"source" : [ "obj-smear-dry-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-out-l", 0 ],
					"source" : [ "obj-smear-out-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-out-r", 0 ],
					"source" : [ "obj-smear-out-r", 0 ]
				}
			}
		]
	}
}
