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
		"description" : "tv.audio v12 - Geometry audio effects with groove~ varispeed",
		"digest" : "Delay (scroll), varispeed (zoom via groove~), freq shift (rotate), lowpass (smear)",
		"tags" : "teevee, audio, geometry, freeze",
		"style" : "",
		"subpatcher_template" : "",
		"assistshowspatchername" : 0,
		"boxes" : [
			{
				"box" : {
					"comment" : "Audio Left In",
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
					"comment" : "Audio Right In",
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
					"patching_rect" : [ 300.0, 30.0, 450.0, 20.0 ],
					"text" : "tv.audio v12 - Geometry Effects with Freeze-Gated Record"
				}
			},
			{
				"box" : {
					"id" : "obj-section-freeze",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 500.0, 70.0, 350.0, 20.0 ],
					"text" : "FREEZE GATE: Phasor-based write control (0=live, 1=frozen)"
				}
			},
			{
				"box" : {
					"id" : "obj-r-freeze",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 500.0, 100.0, 120.0, 22.0 ],
					"text" : "r ---tv_audio_freeze"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 500.0, 130.0, 55.0, 22.0 ],
					"text" : "line~ 0 20"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-check",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 500.0, 160.0, 50.0, 22.0 ],
					"text" : "<~ 0.01"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-freq",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 600.0, 160.0, 120.0, 22.0 ],
					"text" : "scale~ 0.01 0.99 20. 0.5"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-phasor",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 600.0, 190.0, 60.0, 22.0 ],
					"text" : "phasor~ 1"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-window",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 600.0, 220.0, 50.0, 22.0 ],
					"text" : "<~ 0.1"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-full",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 700.0, 160.0, 60.0, 22.0 ],
					"text" : ">=~ 0.99"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-notfull",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 700.0, 190.0, 45.0, 22.0 ],
					"text" : "!-~ 1."
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-stutter",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 600.0, 250.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-addlive",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 500.0, 280.0, 30.0, 22.0 ],
					"text" : "+~"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-clip",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 500.0, 310.0, 70.0, 22.0 ],
					"text" : "clip~ 0. 1."
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-gate-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 500.0, 350.0, 45.0, 22.0 ],
					"text" : "sig~ 1"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-gate-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 600.0, 350.0, 45.0, 22.0 ],
					"text" : "sig~ 1"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-mult-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 500.0, 380.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-freeze-mult-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 600.0, 380.0, 30.0, 22.0 ],
					"text" : "*~"
				}
			},
			{
				"box" : {
					"id" : "obj-section-scroll",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 70.0, 300.0, 20.0 ],
					"text" : "SCROLL: Delay line (receives 0-1000 ms)"
				}
			},
			{
				"box" : {
					"id" : "obj-r-scroll",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 70.0, 115.0, 22.0 ],
					"text" : "r ---tv_audio_scroll"
				}
			},
			{
				"box" : {
					"id" : "obj-scroll-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 300.0, 100.0, 60.0, 22.0 ],
					"text" : "line~ 0 50"
				}
			},
			{
				"box" : {
					"id" : "obj-scroll-snap",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "float" ],
					"patching_rect" : [ 300.0, 135.0, 75.0, 22.0 ],
					"text" : "snapshot~ 50"
				}
			},
			{
				"box" : {
					"id" : "obj-scroll-tapin-l",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "tapconnect" ],
					"patching_rect" : [ 50.0, 100.0, 80.0, 22.0 ],
					"text" : "tapin~ 1100"
				}
			},
			{
				"box" : {
					"id" : "obj-scroll-tapin-r",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "tapconnect" ],
					"patching_rect" : [ 150.0, 100.0, 80.0, 22.0 ],
					"text" : "tapin~ 1100"
				}
			},
			{
				"box" : {
					"id" : "obj-scroll-tap-l",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 130.0, 65.0, 22.0 ],
					"text" : "tapout~ 0"
				}
			},
			{
				"box" : {
					"id" : "obj-scroll-tap-r",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 130.0, 65.0, 22.0 ],
					"text" : "tapout~ 0"
				}
			},
			{
				"box" : {
					"id" : "obj-section-zoom",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 170.0, 350.0, 20.0 ],
					"text" : "ZOOM: Varispeed with freeze-gated write (receives 0.5-2.0)"
				}
			},
			{
				"box" : {
					"id" : "obj-r-zoom",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 170.0, 110.0, 22.0 ],
					"text" : "r ---tv_audio_zoom"
				}
			},
			{
				"box" : {
					"id" : "obj-zoom-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 300.0, 200.0, 60.0, 22.0 ],
					"text" : "line~ 1 50"
				}
			},
			{
				"box" : {
					"id" : "obj-zoom-buf-l",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "float", "bang" ],
					"patching_rect" : [ 450.0, 170.0, 150.0, 22.0 ],
					"text" : "buffer~ ---tv_zoom_l 500"
				}
			},
			{
				"box" : {
					"id" : "obj-zoom-buf-r",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 2,
					"outlettype" : [ "float", "bang" ],
					"patching_rect" : [ 450.0, 200.0, 150.0, 22.0 ],
					"text" : "buffer~ ---tv_zoom_r 500"
				}
			},
			{
				"box" : {
					"id" : "obj-zoom-record-l",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 200.0, 115.0, 22.0 ],
					"text" : "record~ ---tv_zoom_l"
				}
			},
			{
				"box" : {
					"id" : "obj-zoom-record-r",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 200.0, 115.0, 22.0 ],
					"text" : "record~ ---tv_zoom_r"
				}
			},
			{
				"box" : {
					"id" : "obj-zoom-groove-l",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "signal" ],
					"patching_rect" : [ 50.0, 240.0, 115.0, 22.0 ],
					"text" : "groove~ ---tv_zoom_l"
				}
			},
			{
				"box" : {
					"id" : "obj-zoom-groove-r",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "signal" ],
					"patching_rect" : [ 150.0, 240.0, 115.0, 22.0 ],
					"text" : "groove~ ---tv_zoom_r"
				}
			},
			{
				"box" : {
					"id" : "obj-zoom-loop",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "int" ],
					"patching_rect" : [ 300.0, 220.0, 57.0, 22.0 ],
					"text" : "loadbang"
				}
			},
			{
				"box" : {
					"id" : "obj-zoom-loopmsg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 245.0, 35.0, 22.0 ],
					"text" : "loop 1"
				}
			},
			{
				"box" : {
					"id" : "obj-section-freq",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 330.0, 300.0, 20.0 ],
					"text" : "ROTATE: Freq shift (receives -500 to 500 Hz)"
				}
			},
			{
				"box" : {
					"id" : "obj-r-rotate",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 330.0, 120.0, 22.0 ],
					"text" : "r ---tv_audio_rotate"
				}
			},
			{
				"box" : {
					"id" : "obj-rotate-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 300.0, 360.0, 55.0, 22.0 ],
					"text" : "line~ 0 20"
				}
			},
			{
				"box" : {
					"id" : "obj-freqshift-l",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "signal" ],
					"patching_rect" : [ 50.0, 390.0, 70.0, 22.0 ],
					"text" : "freqshift~ 0"
				}
			},
			{
				"box" : {
					"id" : "obj-freqshift-r",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "signal" ],
					"patching_rect" : [ 150.0, 390.0, 70.0, 22.0 ],
					"text" : "freqshift~ 0"
				}
			},
			{
				"box" : {
					"id" : "obj-section-filter",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 430.0, 250.0, 20.0 ],
					"text" : "SMEAR: Lowpass filter (receives 0-1)"
				}
			},
			{
				"box" : {
					"id" : "obj-r-smear",
					"maxclass" : "newobj",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 300.0, 430.0, 115.0, 22.0 ],
					"text" : "r ---tv_audio_smear"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-line",
					"maxclass" : "newobj",
					"numinlets" : 2,
					"numoutlets" : 2,
					"outlettype" : [ "signal", "bang" ],
					"patching_rect" : [ 300.0, 460.0, 55.0, 22.0 ],
					"text" : "line~ 0 20"
				}
			},
			{
				"box" : {
					"id" : "obj-smear-scale",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 300.0, 490.0, 140.0, 22.0 ],
					"text" : "scale~ 0. 1. 20000. 200."
				}
			},
			{
				"box" : {
					"id" : "obj-lores-l",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 50.0, 490.0, 95.0, 22.0 ],
					"text" : "lores~ 20000 0.5"
				}
			},
			{
				"box" : {
					"id" : "obj-lores-r",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 1,
					"outlettype" : [ "signal" ],
					"patching_rect" : [ 150.0, 490.0, 95.0, 22.0 ],
					"text" : "lores~ 20000 0.5"
				}
			},
			{
				"box" : {
					"comment" : "Audio Left Out",
					"id" : "obj-out-l",
					"index" : 1,
					"maxclass" : "outlet",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 550.0, 30.0, 30.0 ]
				}
			},
			{
				"box" : {
					"comment" : "Audio Right Out",
					"id" : "obj-out-r",
					"index" : 2,
					"maxclass" : "outlet",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 150.0, 550.0, 30.0, 30.0 ]
				}
			}
		],
		"lines" : [
			{
				"patchline" : {
					"destination" : [ "obj-scroll-tapin-l", 0 ],
					"source" : [ "obj-in-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scroll-tapin-r", 0 ],
					"source" : [ "obj-in-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-line", 0 ],
					"source" : [ "obj-r-freeze", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-check", 0 ],
					"order" : 2,
					"source" : [ "obj-freeze-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-freq", 0 ],
					"order" : 1,
					"source" : [ "obj-freeze-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-full", 0 ],
					"order" : 0,
					"source" : [ "obj-freeze-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-addlive", 0 ],
					"source" : [ "obj-freeze-check", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-phasor", 0 ],
					"source" : [ "obj-freeze-freq", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-window", 0 ],
					"source" : [ "obj-freeze-phasor", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-stutter", 0 ],
					"source" : [ "obj-freeze-window", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-notfull", 0 ],
					"source" : [ "obj-freeze-full", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-stutter", 1 ],
					"source" : [ "obj-freeze-notfull", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-addlive", 1 ],
					"source" : [ "obj-freeze-stutter", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-clip", 0 ],
					"source" : [ "obj-freeze-addlive", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-mult-l", 1 ],
					"order" : 1,
					"source" : [ "obj-freeze-clip", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-mult-r", 1 ],
					"order" : 0,
					"source" : [ "obj-freeze-clip", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-mult-l", 0 ],
					"source" : [ "obj-freeze-gate-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freeze-mult-r", 0 ],
					"source" : [ "obj-freeze-gate-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-zoom-record-l", 1 ],
					"source" : [ "obj-freeze-mult-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-zoom-record-r", 1 ],
					"source" : [ "obj-freeze-mult-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scroll-line", 0 ],
					"source" : [ "obj-r-scroll", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scroll-snap", 0 ],
					"source" : [ "obj-scroll-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scroll-tap-l", 0 ],
					"order" : 1,
					"source" : [ "obj-scroll-snap", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scroll-tap-r", 0 ],
					"order" : 0,
					"source" : [ "obj-scroll-snap", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scroll-tap-l", 0 ],
					"source" : [ "obj-scroll-tapin-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-scroll-tap-r", 0 ],
					"source" : [ "obj-scroll-tapin-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-zoom-record-l", 0 ],
					"source" : [ "obj-scroll-tap-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-zoom-record-r", 0 ],
					"source" : [ "obj-scroll-tap-r", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-zoom-groove-l", 0 ],
					"order" : 1,
					"source" : [ "obj-zoom-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-zoom-groove-r", 0 ],
					"order" : 0,
					"source" : [ "obj-zoom-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-zoom-loopmsg", 0 ],
					"source" : [ "obj-zoom-loop", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-zoom-groove-l", 0 ],
					"order" : 1,
					"source" : [ "obj-zoom-loopmsg", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-zoom-groove-r", 0 ],
					"order" : 0,
					"source" : [ "obj-zoom-loopmsg", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freqshift-l", 0 ],
					"source" : [ "obj-zoom-groove-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freqshift-r", 0 ],
					"source" : [ "obj-zoom-groove-r", 0 ]
				}
			},

			{
				"patchline" : {
					"destination" : [ "obj-zoom-line", 0 ],
					"source" : [ "obj-r-zoom", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-rotate-line", 0 ],
					"source" : [ "obj-r-rotate", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freqshift-l", 1 ],
					"order" : 1,
					"source" : [ "obj-rotate-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-freqshift-r", 1 ],
					"order" : 0,
					"source" : [ "obj-rotate-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-lores-l", 0 ],
					"source" : [ "obj-freqshift-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-lores-r", 0 ],
					"source" : [ "obj-freqshift-r", 0 ]
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
					"destination" : [ "obj-smear-scale", 0 ],
					"source" : [ "obj-smear-line", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-lores-l", 1 ],
					"order" : 1,
					"source" : [ "obj-smear-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-lores-r", 1 ],
					"order" : 0,
					"source" : [ "obj-smear-scale", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-out-l", 0 ],
					"source" : [ "obj-lores-l", 0 ]
				}
			},
			{
				"patchline" : {
					"destination" : [ "obj-out-r", 0 ],
					"source" : [ "obj-lores-r", 0 ]
				}
			}
		]
	}
}
