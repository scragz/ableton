{
  "patcher": {
    "fileversion": 1,
    "appversion": {
      "major": 9,
      "minor": 0,
      "revision": 9,
      "architecture": "x64",
      "modernui": 1
    },
    "classnamespace": "box",
    "rect": [
      60,
      80,
      1140,
      680
    ],
    "openrect": [
      0,
      0,
      1030,
      188
    ],
    "devicewidth": 1030,
    "openinpresentation": 1,
    "bglocked": 1,
    "boxes": [
      {
        "box": {
          "id": "panel",
          "maxclass": "jsui",
          "patching_rect": [
            0,
            0,
            1030,
            188
          ],
          "filename": "calcinatio-art.js",
          "presentation": 1,
          "presentation_rect": [
            0,
            0,
            1030,
            188
          ],
          "border": 0,
          "ignoreclick": 1,
          "background": 1,
          "numinlets": 1,
          "numoutlets": 0
        }
      },
      {
        "box": {
          "id": "input_trim",
          "maxclass": "live.dial",
          "patching_rect": [
            20,
            430,
            51,
            52
          ],
          "varname": "input_trim",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Input dB",
              "parameter_shortname": "Input dB",
              "parameter_type": 0,
              "parameter_mmin": -36,
              "parameter_mmax": 24,
              "parameter_initial": [
                0
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 4
            }
          },
          "presentation": 1,
          "presentation_rect": [
            48,
            32,
            51,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_input_trim",
          "maxclass": "newobj",
          "patching_rect": [
            20,
            470,
            178,
            22
          ],
          "text": "prepend input_trim",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "seed_level",
          "maxclass": "live.dial",
          "patching_rect": [
            160,
            430,
            51,
            52
          ],
          "varname": "seed_level",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Seed dB",
              "parameter_shortname": "Seed dB",
              "parameter_type": 0,
              "parameter_mmin": -120,
              "parameter_mmax": -60,
              "parameter_initial": [
                -100
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 1
            }
          },
          "presentation": 1,
          "presentation_rect": [
            48,
            88,
            51,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_seed_level",
          "maxclass": "newobj",
          "patching_rect": [
            160,
            470,
            178,
            22
          ],
          "text": "prepend seed_level",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "input_mute",
          "maxclass": "live.text",
          "patching_rect": [
            300,
            430,
            94,
            21
          ],
          "varname": "input_mute",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Mute Input",
              "parameter_shortname": "Mute Input",
              "parameter_type": 2,
              "parameter_mmin": 0,
              "parameter_mmax": 1,
              "parameter_initial": [
                0
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 9,
              "parameter_enum": [
                "Input",
                "Mute"
              ]
            }
          },
          "presentation": 1,
          "presentation_rect": [
            29,
            162,
            94,
            21
          ],
          "text": "Mute Input",
          "texton": "Mute Input",
          "mode": 1
        }
      },
      {
        "box": {
          "id": "label_input_mute",
          "maxclass": "comment",
          "patching_rect": [
            29,
            143,
            94,
            16
          ],
          "text": "Mute Input",
          "presentation": 1,
          "presentation_rect": [
            29,
            143,
            94,
            16
          ],
          "fontname": "Ableton Sans Medium",
          "fontsize": 9,
          "textjustification": 0,
          "saved_attribute_attributes": {
            "textcolor": {
              "expression": "themecolor.live_control_fg"
            }
          },
          "numinlets": 1,
          "numoutlets": 0
        }
      },
      {
        "box": {
          "id": "prepend_input_mute",
          "maxclass": "newobj",
          "patching_rect": [
            300,
            470,
            178,
            22
          ],
          "text": "prepend input_mute",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "core_order",
          "maxclass": "live.menu",
          "patching_rect": [
            440,
            430,
            212,
            21
          ],
          "varname": "core_order",
          "numinlets": 1,
          "numoutlets": 3,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Order",
              "parameter_shortname": "Order",
              "parameter_type": 2,
              "parameter_mmin": 0,
              "parameter_mmax": 2,
              "parameter_initial": [
                0
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 9,
              "parameter_enum": [
                "Fold > Fuzz > Degrade",
                "Degrade > Fold > Fuzz",
                "Fuzz > Degrade > Fold"
              ]
            }
          },
          "presentation": 1,
          "presentation_rect": [
            169,
            39,
            212,
            21
          ]
        }
      },
      {
        "box": {
          "id": "label_core_order",
          "maxclass": "comment",
          "patching_rect": [
            169,
            20,
            212,
            16
          ],
          "text": "Order",
          "presentation": 1,
          "presentation_rect": [
            169,
            20,
            212,
            16
          ],
          "fontname": "Ableton Sans Medium",
          "fontsize": 9,
          "textjustification": 0,
          "saved_attribute_attributes": {
            "textcolor": {
              "expression": "themecolor.live_control_fg"
            }
          },
          "numinlets": 1,
          "numoutlets": 0
        }
      },
      {
        "box": {
          "id": "prepend_core_order",
          "maxclass": "newobj",
          "patching_rect": [
            440,
            470,
            178,
            22
          ],
          "text": "prepend core_order",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "fold_stages",
          "maxclass": "live.dial",
          "patching_rect": [
            580,
            430,
            44,
            52
          ],
          "varname": "fold_stages",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Stages",
              "parameter_shortname": "Stages",
              "parameter_type": 1,
              "parameter_mmin": 1,
              "parameter_mmax": 6,
              "parameter_initial": [
                2
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 0
            }
          },
          "presentation": 1,
          "presentation_rect": [
            216,
            63,
            44,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_fold_stages",
          "maxclass": "newobj",
          "patching_rect": [
            580,
            470,
            178,
            22
          ],
          "text": "prepend fold_stages",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "fold_depth",
          "maxclass": "live.dial",
          "patching_rect": [
            720,
            430,
            44,
            52
          ],
          "varname": "fold_depth",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Fold",
              "parameter_shortname": "Fold",
              "parameter_type": 0,
              "parameter_mmin": 0,
              "parameter_mmax": 12,
              "parameter_initial": [
                4
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 1
            }
          },
          "presentation": 1,
          "presentation_rect": [
            318,
            63,
            44,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_fold_depth",
          "maxclass": "newobj",
          "patching_rect": [
            720,
            470,
            178,
            22
          ],
          "text": "prepend fold_depth",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "fuzz_bias",
          "maxclass": "live.dial",
          "patching_rect": [
            860,
            430,
            44,
            52
          ],
          "varname": "fuzz_bias",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Bias",
              "parameter_shortname": "Bias",
              "parameter_type": 0,
              "parameter_mmin": -0.8,
              "parameter_mmax": 0.8,
              "parameter_initial": [
                0.15
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 1
            }
          },
          "presentation": 1,
          "presentation_rect": [
            216,
            122,
            44,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_fuzz_bias",
          "maxclass": "newobj",
          "patching_rect": [
            860,
            470,
            178,
            22
          ],
          "text": "prepend fuzz_bias",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "drift_rate",
          "maxclass": "live.dial",
          "patching_rect": [
            1000,
            430,
            44,
            52
          ],
          "varname": "drift_rate",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Drift Hz",
              "parameter_shortname": "Drift Hz",
              "parameter_type": 0,
              "parameter_mmin": 0.001,
              "parameter_mmax": 0.3,
              "parameter_initial": [
                0.027
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 3
            }
          },
          "presentation": 1,
          "presentation_rect": [
            318,
            122,
            44,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_drift_rate",
          "maxclass": "newobj",
          "patching_rect": [
            1000,
            470,
            178,
            22
          ],
          "text": "prepend drift_rate",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "bit_depth",
          "maxclass": "live.dial",
          "patching_rect": [
            20,
            510,
            51,
            52
          ],
          "varname": "bit_depth",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Bits",
              "parameter_shortname": "Bits",
              "parameter_type": 1,
              "parameter_mmin": 2,
              "parameter_mmax": 16,
              "parameter_initial": [
                14
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 0
            }
          },
          "presentation": 1,
          "presentation_rect": [
            450,
            32,
            51,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_bit_depth",
          "maxclass": "newobj",
          "patching_rect": [
            20,
            550,
            178,
            22
          ],
          "text": "prepend bit_depth",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "hold_samples",
          "maxclass": "live.dial",
          "patching_rect": [
            160,
            510,
            51,
            52
          ],
          "varname": "hold_samples",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Hold smp",
              "parameter_shortname": "Hold smp",
              "parameter_type": 1,
              "parameter_mmin": 1,
              "parameter_mmax": 64,
              "parameter_initial": [
                1
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 0
            }
          },
          "presentation": 1,
          "presentation_rect": [
            450,
            92,
            51,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_hold_samples",
          "maxclass": "newobj",
          "patching_rect": [
            160,
            550,
            178,
            22
          ],
          "text": "prepend hold_samples",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "delay_ms",
          "maxclass": "live.dial",
          "patching_rect": [
            300,
            510,
            51,
            52
          ],
          "varname": "delay_ms",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Delay ms",
              "parameter_shortname": "Delay ms",
              "parameter_type": 0,
              "parameter_mmin": 0.5,
              "parameter_mmax": 40,
              "parameter_initial": [
                7
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 2
            }
          },
          "presentation": 1,
          "presentation_rect": [
            574,
            32,
            51,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_delay_ms",
          "maxclass": "newobj",
          "patching_rect": [
            300,
            550,
            178,
            22
          ],
          "text": "prepend delay_ms",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "mod_depth",
          "maxclass": "live.dial",
          "patching_rect": [
            440,
            510,
            51,
            52
          ],
          "varname": "mod_depth",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Mod ms",
              "parameter_shortname": "Mod ms",
              "parameter_type": 0,
              "parameter_mmin": 0,
              "parameter_mmax": 5,
              "parameter_initial": [
                0.3
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 2
            }
          },
          "presentation": 1,
          "presentation_rect": [
            675,
            32,
            51,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_mod_depth",
          "maxclass": "newobj",
          "patching_rect": [
            440,
            550,
            178,
            22
          ],
          "text": "prepend mod_depth",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "mod_rate",
          "maxclass": "live.dial",
          "patching_rect": [
            580,
            510,
            51,
            52
          ],
          "varname": "mod_rate",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Mod Hz",
              "parameter_shortname": "Mod Hz",
              "parameter_type": 0,
              "parameter_mmin": 0.001,
              "parameter_mmax": 5,
              "parameter_initial": [
                0.13
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 3
            }
          },
          "presentation": 1,
          "presentation_rect": [
            574,
            92,
            51,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_mod_rate",
          "maxclass": "newobj",
          "patching_rect": [
            580,
            550,
            178,
            22
          ],
          "text": "prepend mod_rate",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "feedback",
          "maxclass": "live.dial",
          "patching_rect": [
            720,
            510,
            51,
            52
          ],
          "varname": "feedback",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Feedback",
              "parameter_shortname": "Feedback",
              "parameter_type": 0,
              "parameter_mmin": 0,
              "parameter_mmax": 1.7,
              "parameter_initial": [
                1.08
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 1
            }
          },
          "presentation": 1,
          "presentation_rect": [
            675,
            92,
            51,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_feedback",
          "maxclass": "newobj",
          "patching_rect": [
            720,
            550,
            178,
            22
          ],
          "text": "prepend feedback",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "ceiling",
          "maxclass": "live.dial",
          "patching_rect": [
            860,
            510,
            51,
            52
          ],
          "varname": "ceiling",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Ceiling dB",
              "parameter_shortname": "Ceiling dB",
              "parameter_type": 0,
              "parameter_mmin": -24,
              "parameter_mmax": 0,
              "parameter_initial": [
                -1
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 4
            }
          },
          "presentation": 1,
          "presentation_rect": [
            821,
            32,
            51,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_ceiling",
          "maxclass": "newobj",
          "patching_rect": [
            860,
            550,
            178,
            22
          ],
          "text": "prepend ceiling",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "drywet",
          "maxclass": "live.dial",
          "patching_rect": [
            1000,
            510,
            51,
            52
          ],
          "varname": "drywet",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Dry/Wet",
              "parameter_shortname": "Dry/Wet",
              "parameter_type": 0,
              "parameter_mmin": 0,
              "parameter_mmax": 100,
              "parameter_initial": [
                100
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 5
            }
          },
          "presentation": 1,
          "presentation_rect": [
            923,
            32,
            51,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_drywet",
          "maxclass": "newobj",
          "patching_rect": [
            1000,
            550,
            178,
            22
          ],
          "text": "prepend drywet",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "stereo",
          "maxclass": "live.text",
          "patching_rect": [
            20,
            590,
            76,
            21
          ],
          "varname": "stereo",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Stereo",
              "parameter_shortname": "Stereo",
              "parameter_type": 2,
              "parameter_mmin": 0,
              "parameter_mmax": 1,
              "parameter_initial": [
                1
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 9,
              "parameter_enum": [
                "Mono",
                "Stereo"
              ]
            }
          },
          "presentation": 1,
          "presentation_rect": [
            812,
            130,
            76,
            21
          ],
          "text": "Stereo",
          "texton": "Stereo",
          "mode": 1
        }
      },
      {
        "box": {
          "id": "label_stereo",
          "maxclass": "comment",
          "patching_rect": [
            812,
            111,
            76,
            16
          ],
          "text": "Stereo",
          "presentation": 1,
          "presentation_rect": [
            812,
            111,
            76,
            16
          ],
          "fontname": "Ableton Sans Medium",
          "fontsize": 9,
          "textjustification": 0,
          "saved_attribute_attributes": {
            "textcolor": {
              "expression": "themecolor.live_control_fg"
            }
          },
          "numinlets": 1,
          "numoutlets": 0
        }
      },
      {
        "box": {
          "id": "prepend_stereo",
          "maxclass": "newobj",
          "patching_rect": [
            20,
            630,
            178,
            22
          ],
          "text": "prepend stereo",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "output_trim",
          "maxclass": "live.dial",
          "patching_rect": [
            160,
            590,
            51,
            52
          ],
          "varname": "output_trim",
          "numinlets": 1,
          "numoutlets": 2,
          "parameter_enable": 1,
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Output dB",
              "parameter_shortname": "Output dB",
              "parameter_type": 0,
              "parameter_mmin": -36,
              "parameter_mmax": 12,
              "parameter_initial": [
                -12
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 4
            }
          },
          "presentation": 1,
          "presentation_rect": [
            923,
            92,
            51,
            52
          ],
          "showname": 1,
          "shownumber": 1
        }
      },
      {
        "box": {
          "id": "prepend_output_trim",
          "maxclass": "newobj",
          "patching_rect": [
            160,
            630,
            178,
            22
          ],
          "text": "prepend output_trim",
          "numinlets": 1,
          "numoutlets": 1
        }
      },
      {
        "box": {
          "id": "input",
          "maxclass": "newobj",
          "patching_rect": [
            220,
            270,
            178,
            22
          ],
          "text": "plugin~",
          "numinlets": 2,
          "numoutlets": 2,
          "outlettype": [
            "signal",
            "signal"
          ]
        }
      },
      {
        "box": {
          "id": "dsp",
          "maxclass": "newobj",
          "patching_rect": [
            220,
            325,
            178,
            22
          ],
          "text": "gen~",
          "numinlets": 2,
          "numoutlets": 2,
          "varname": "dsp",
          "patcher": {
            "fileversion": 1,
            "appversion": {
              "major": 9,
              "minor": 0,
              "revision": 9,
              "architecture": "x64",
              "modernui": 1
            },
            "classnamespace": "dsp.gen",
            "rect": [
              0,
              0,
              1180,
              880
            ],
            "boxes": [
              {
                "box": {
                  "id": "code",
                  "maxclass": "codebox",
                  "code": "// Calcinatio: one continuously seeded core for silence and incoming audio.\n// The seed is always present, including when Input Mute is engaged.\nfoldwave(x, amount, count) {\n    v = x;\n    for (i = 0; i < 6; i += 1) {\n        if (i < count) {\n            v = 1 - abs(wrap(v * (1 + amount * 0.42) + 1, 0, 4) - 2);\n        }\n    }\n    return v;\n}\nfuzzwave(x, bias) {\n    // Deliberately asymmetric; the following DC blocker keeps the loop centered.\n    return tanh((x + bias) * 2.8);\n}\n\nParam input_trim(0);\nParam seed_level(-100);\nParam input_mute(0);\nParam core_order(0);\nParam fold_stages(2);\nParam fold_depth(4);\nParam fuzz_bias(0.15);\nParam drift_rate(0.027);\nParam bit_depth(14);\nParam hold_samples(1);\nParam delay_ms(7);\nParam mod_depth(0.3);\nParam mod_rate(0.13);\nParam feedback(1.08);\nParam ceiling(-1);\nParam drywet(100);\nParam stereo(1);\nParam output_trim(-12);\n\nHistory driftL(0);\nHistory driftR(0.37);\nHistory modL(0);\nHistory modR(0.29);\nHistory countL(1000);\nHistory countR(1000);\nHistory heldL(0);\nHistory heldR(0);\nDelay loopL(16384);\nDelay loopR(16384);\n\n// Independent phases and random draws preserve stereo width in self generation.\ndriftL = wrap(driftL + max(0.001, drift_rate) / samplerate, 0, 1);\ndriftR = wrap(driftR + max(0.001, drift_rate) / samplerate, 0, 1);\nmodL = wrap(modL + max(0.001, mod_rate) / samplerate, 0, 1);\nmodR = wrap(modR + max(0.001, mod_rate) / samplerate, 0, 1);\nbiasL = clamp(fuzz_bias + 0.18 * sin(twopi * driftL), -0.95, 0.95);\nbiasR = clamp(fuzz_bias + 0.18 * sin(twopi * driftR), -0.95, 0.95);\nseedGain = pow(10, clamp(seed_level, -120, -60) / 20);\ninputGain = pow(10, clamp(input_trim, -36, 24) / 20);\nsourceL = input_mute >= 0.5 ? 0 : in1 * inputGain;\nsourceR = input_mute >= 0.5 ? 0 : in2 * inputGain;\nmonoSource = (sourceL + sourceR) * 0.5;\nsourceL = stereo < 0.5 ? monoSource : sourceL;\nsourceR = stereo < 0.5 ? monoSource : sourceR;\nseedL = noise() * seedGain;\nseedR = noise() * seedGain;\norder = clamp(floor(core_order + 0.5), 0, 2);\nstages = clamp(floor(fold_stages + 0.5), 1, 6);\ndepth = clamp(fold_depth, 0, 12);\nbits = clamp(floor(bit_depth + 0.5), 2, 16);\nlevels = pow(2, bits - 1);\nhold = clamp(floor(hold_samples + 0.5), 1, 64);\n\ntimeL = delay_ms + mod_depth * sin(twopi * modL);\ntimeR = delay_ms + mod_depth * sin(twopi * modR);\ntapL = loopL.read(clamp(timeL * samplerate * 0.001, 2, 16380), interp=\"linear\");\ntapR = loopR.read(clamp(timeR * samplerate * 0.001, 2, 16380), interp=\"linear\");\n// This tanh is the loop guard; it acts before the nonlinear core, independently\n// of the final output ceiling. The read remains bounded at feedback > 1.\nguardL = tanh(fixdenorm(tapL) * clamp(feedback, 0, 1.7));\nguardR = tanh(fixdenorm(tapR) * clamp(feedback, 0, 1.7));\nstartL = dcblock(sourceL + seedL + guardL);\nstartR = dcblock(sourceR + seedR + guardR);\n\n// Three actual topologies: Fold/Fuzz/Degrade, Degrade/Fold/Fuzz,\n// Fuzz/Degrade/Fold. The hold/quantizer runs once per channel in all modes.\npreL = order == 0 ? fuzzwave(foldwave(startL, depth, stages), biasL)\n     : order == 1 ? startL : fuzzwave(startL, biasL);\npreR = order == 0 ? fuzzwave(foldwave(startR, depth, stages), biasR)\n     : order == 1 ? startR : fuzzwave(startR, biasR);\ncountL += 1;\ncountR += 1;\nif (countL >= hold) {\n    // TPDF-like quantizer dither avoids a dead band that would swallow the\n    // -100 dB seed whenever Degrade is placed first or bit depth is low.\n    heldL = round(clamp(preL + (noise() - noise()) / levels * 0.5, -1, 1) * levels) / levels;\n    countL = 0;\n}\nif (countR >= hold) {\n    heldR = round(clamp(preR + (noise() - noise()) / levels * 0.5, -1, 1) * levels) / levels;\n    countR = 0;\n}\ncoreL = order == 0 ? heldL\n      : order == 1 ? fuzzwave(foldwave(heldL, depth, stages), biasL)\n      : foldwave(heldL, depth, stages);\ncoreR = order == 0 ? heldR\n      : order == 1 ? fuzzwave(foldwave(heldR, depth, stages), biasR)\n      : foldwave(heldR, depth, stages);\n// Rectification and bias create DC; remove it before the feedback tap.\ncleanL = dcblock(coreL);\ncleanR = dcblock(coreR);\nloopL.write(fixdenorm(cleanL));\nloopR.write(fixdenorm(cleanR));\n\nwetL = cleanL;\nwetR = stereo < 0.5 ? cleanL : cleanR;\ndryL = stereo < 0.5 ? monoSource : sourceL;\ndryR = stereo < 0.5 ? monoSource : sourceR;\nblend = clamp(drywet * 0.01, 0, 1);\nsumL = mix(dryL, wetL, blend);\nsumR = mix(dryR, wetR, blend);\nlimit = pow(10, clamp(ceiling, -24, 0) / 20);\ntrim = pow(10, clamp(output_trim, -36, 12) / 20);\nout1 = clamp(tanh(sumL / limit) * limit * trim, -limit, limit);\nout2 = clamp(tanh(sumR / limit) * limit * trim, -limit, limit);\n",
                  "numinlets": 2,
                  "numoutlets": 2,
                  "patching_rect": [
                    70,
                    80,
                    1050,
                    700
                  ]
                }
              },
              {
                "box": {
                  "id": "in0",
                  "maxclass": "newobj",
                  "text": "in 1",
                  "numinlets": 0,
                  "numoutlets": 1,
                  "patching_rect": [
                    40,
                    25,
                    55,
                    22
                  ]
                }
              },
              {
                "box": {
                  "id": "out0",
                  "maxclass": "newobj",
                  "text": "out 1",
                  "numinlets": 1,
                  "numoutlets": 0,
                  "patching_rect": [
                    40,
                    810,
                    55,
                    22
                  ]
                }
              },
              {
                "box": {
                  "id": "in1",
                  "maxclass": "newobj",
                  "text": "in 2",
                  "numinlets": 0,
                  "numoutlets": 1,
                  "patching_rect": [
                    150,
                    25,
                    55,
                    22
                  ]
                }
              },
              {
                "box": {
                  "id": "out1",
                  "maxclass": "newobj",
                  "text": "out 2",
                  "numinlets": 1,
                  "numoutlets": 0,
                  "patching_rect": [
                    150,
                    810,
                    55,
                    22
                  ]
                }
              }
            ],
            "lines": [
              {
                "patchline": {
                  "source": [
                    "in0",
                    0
                  ],
                  "destination": [
                    "code",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "source": [
                    "code",
                    0
                  ],
                  "destination": [
                    "out0",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "source": [
                    "in1",
                    0
                  ],
                  "destination": [
                    "code",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "source": [
                    "code",
                    1
                  ],
                  "destination": [
                    "out1",
                    0
                  ]
                }
              }
            ]
          },
          "outlettype": [
            "signal",
            "signal"
          ]
        }
      },
      {
        "box": {
          "id": "output",
          "maxclass": "newobj",
          "patching_rect": [
            220,
            375,
            178,
            22
          ],
          "text": "plugout~",
          "numinlets": 2,
          "numoutlets": 2
        }
      },
      {
        "box": {
          "id": "ready",
          "maxclass": "newobj",
          "patching_rect": [
            20,
            270,
            178,
            22
          ],
          "text": "live.thisdevice",
          "numinlets": 1,
          "numoutlets": 3
        }
      }
    ],
    "lines": [
      {
        "patchline": {
          "source": [
            "input_trim",
            0
          ],
          "destination": [
            "prepend_input_trim",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_input_trim",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "seed_level",
            0
          ],
          "destination": [
            "prepend_seed_level",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_seed_level",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input_mute",
            0
          ],
          "destination": [
            "prepend_input_mute",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_input_mute",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "core_order",
            0
          ],
          "destination": [
            "prepend_core_order",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_core_order",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "fold_stages",
            0
          ],
          "destination": [
            "prepend_fold_stages",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_fold_stages",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "fold_depth",
            0
          ],
          "destination": [
            "prepend_fold_depth",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_fold_depth",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "fuzz_bias",
            0
          ],
          "destination": [
            "prepend_fuzz_bias",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_fuzz_bias",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "drift_rate",
            0
          ],
          "destination": [
            "prepend_drift_rate",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_drift_rate",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "bit_depth",
            0
          ],
          "destination": [
            "prepend_bit_depth",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_bit_depth",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "hold_samples",
            0
          ],
          "destination": [
            "prepend_hold_samples",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_hold_samples",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "delay_ms",
            0
          ],
          "destination": [
            "prepend_delay_ms",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_delay_ms",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "mod_depth",
            0
          ],
          "destination": [
            "prepend_mod_depth",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_mod_depth",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "mod_rate",
            0
          ],
          "destination": [
            "prepend_mod_rate",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_mod_rate",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "feedback",
            0
          ],
          "destination": [
            "prepend_feedback",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_feedback",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "ceiling",
            0
          ],
          "destination": [
            "prepend_ceiling",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_ceiling",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "drywet",
            0
          ],
          "destination": [
            "prepend_drywet",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_drywet",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "stereo",
            0
          ],
          "destination": [
            "prepend_stereo",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_stereo",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "output_trim",
            0
          ],
          "destination": [
            "prepend_output_trim",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "prepend_output_trim",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            0
          ],
          "destination": [
            "dsp",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "dsp",
            0
          ],
          "destination": [
            "output",
            0
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "input",
            1
          ],
          "destination": [
            "dsp",
            1
          ]
        }
      },
      {
        "patchline": {
          "source": [
            "dsp",
            1
          ],
          "destination": [
            "output",
            1
          ]
        }
      }
    ],
    "parameters": {
      "input_trim": [
        "Input dB",
        "Input dB",
        0
      ],
      "seed_level": [
        "Seed dB",
        "Seed dB",
        0
      ],
      "input_mute": [
        "Mute Input",
        "Mute Input",
        0
      ],
      "core_order": [
        "Order",
        "Order",
        0
      ],
      "fold_stages": [
        "Stages",
        "Stages",
        0
      ],
      "fold_depth": [
        "Fold",
        "Fold",
        0
      ],
      "fuzz_bias": [
        "Bias",
        "Bias",
        0
      ],
      "drift_rate": [
        "Drift Hz",
        "Drift Hz",
        0
      ],
      "bit_depth": [
        "Bits",
        "Bits",
        0
      ],
      "hold_samples": [
        "Hold smp",
        "Hold smp",
        0
      ],
      "delay_ms": [
        "Delay ms",
        "Delay ms",
        0
      ],
      "mod_depth": [
        "Mod ms",
        "Mod ms",
        0
      ],
      "mod_rate": [
        "Mod Hz",
        "Mod Hz",
        0
      ],
      "feedback": [
        "Feedback",
        "Feedback",
        0
      ],
      "ceiling": [
        "Ceiling dB",
        "Ceiling dB",
        0
      ],
      "drywet": [
        "Dry/Wet",
        "Dry/Wet",
        0
      ],
      "stereo": [
        "Stereo",
        "Stereo",
        0
      ],
      "output_trim": [
        "Output dB",
        "Output dB",
        0
      ],
      "parameterbanks": {
        "0": {
          "index": 0,
          "name": "Calcinatio",
          "parameters": [
            "input_trim",
            "seed_level",
            "core_order",
            "fold_depth",
            "bit_depth",
            "feedback",
            "drywet",
            "output_trim"
          ]
        },
        "1": {
          "index": 1,
          "name": "Core",
          "parameters": [
            "input_mute",
            "fold_stages",
            "fuzz_bias",
            "drift_rate",
            "hold_samples",
            "stereo",
            "-",
            "-"
          ]
        },
        "2": {
          "index": 2,
          "name": "Feedback",
          "parameters": [
            "delay_ms",
            "mod_depth",
            "mod_rate",
            "feedback",
            "ceiling",
            "-",
            "-",
            "-"
          ]
        }
      },
      "inherited_shortname": 1
    },
    "default_fontname": "Ableton Sans Medium",
    "default_fontsize": 9,
    "dependency_cache": [
      {
        "name": "calcinatio-theme.js",
        "type": "TEXT",
        "implicit": 1
      },
      {
        "name": "calcinatio-art.js",
        "type": "TEXT",
        "implicit": 1
      }
    ],
    "autosave": 0
  }
}
