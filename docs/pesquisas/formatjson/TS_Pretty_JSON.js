/*:
 * // Also targets MV! This is just to turn off the warning in MZ.
 * @target MZ
 *
 * @pluginname Pretty JSON
 * @plugindesc (Ver. 1.0.2) When enabled, automatically prettifies JSON files in data/.
 *
 * @author Tamschi (tamschi.itch.io)
 *
 * @param formattingRules
 * @text Formatting Rules:
 * @desc Specifies which files should be formatted, and which parts to collapse. The first matching rule is used.
 * @type struct<FormattingRule>[]
 * @default ["{\"note\":\"\\\"Actors\\\"\",\"format\":\"true\",\"pathPattern_\":\"Actors.json\",\"collapsedDataPatterns__\":\"[\\\"*.traits.*\\\",\\\"*.equips\\\"]\"}","{\"note\":\"\\\"Classes\\\"\",\"format\":\"true\",\"pathPattern_\":\"Classes.json\",\"collapsedDataPatterns__\":\"[\\\"*.expParams\\\",\\\"*.traits.*\\\",\\\"*.learnings.*\\\",\\\"*.params.*\\\"]\"}","{\"note\":\"\\\"Skills\\\"\",\"format\":\"true\",\"pathPattern_\":\"Skills.json\",\"collapsedDataPatterns__\":\"[\\\"*.effects.*\\\"]\"}","{\"note\":\"\\\"Items\\\"\",\"format\":\"true\",\"pathPattern_\":\"Items.json\",\"collapsedDataPatterns__\":\"[\\\"*.effects.*\\\"]\"}","{\"note\":\"\\\"Weapons\\\"\",\"format\":\"true\",\"pathPattern_\":\"Weapons.json\",\"collapsedDataPatterns__\":\"[\\\"*.traits.*\\\",\\\"*.params\\\"]\"}","{\"note\":\"\\\"Armors\\\"\",\"format\":\"true\",\"pathPattern_\":\"Armors.json\",\"collapsedDataPatterns__\":\"[\\\"*.traits.*\\\",\\\"*.params\\\"]\"}","{\"note\":\"\\\"Enemies\\\"\",\"format\":\"true\",\"pathPattern_\":\"Enemies.json\",\"collapsedDataPatterns__\":\"[\\\"*.actions.*\\\",\\\"*.dropItems.*\\\",\\\"*.traits.*\\\",\\\"*.params\\\"]\"}","{\"note\":\"\\\"Troops\\\"\",\"format\":\"true\",\"pathPattern_\":\"Troops.json\",\"collapsedDataPatterns__\":\"[\\\"*.members.*\\\",\\\"*.pages.*.list.*\\\"]\"}","{\"note\":\"\\\"States\\\"\",\"format\":\"true\",\"pathPattern_\":\"States.json\",\"collapsedDataPatterns__\":\"[\\\"*.traits.*\\\"]\"}","{\"note\":\"\\\"Animations\\\"\",\"format\":\"true\",\"pathPattern_\":\"Animations.json\",\"collapsedDataPatterns__\":\"[\\\"*.frames.*.*\\\",\\\"*.timings.*.flashColor\\\",\\\"*.timings.*.se\\\",\\\"*.flashTimings.*\\\",\\\"*.rotation\\\",\\\"*.soundTimings.*\\\"]\"}","{\"note\":\"\\\"Tilesets\\\"\",\"format\":\"true\",\"pathPattern_\":\"Tilesets.json\",\"collapsedDataPatterns__\":\"[\\\"*.flags\\\"]\"}","{\"note\":\"\\\"Common Events\\\"\",\"format\":\"true\",\"pathPattern_\":\"CommonEvents.json\",\"collapsedDataPatterns__\":\"[\\\"*.list.*\\\"]\"}","{\"note\":\"\\\"System\\\"\",\"format\":\"true\",\"pathPattern_\":\"System.json\",\"collapsedDataPatterns__\":\"[\\\"airship.bgm\\\",\\\"attackMotions.*\\\",\\\"battleBgm\\\",\\\"boat.bgm\\\",\\\"gameoverMe\\\",\\\"ship.bgm\\\",\\\"sounds.*\\\",\\\"testBattlers.*\\\",\\\"titleBgm\\\",\\\"victoryMe\\\",\\\"windowTone\\\"]\"}","{\"note\":\"\\\"Map Infos\\\"\",\"format\":\"true\",\"pathPattern_\":\"MapInfos.json\",\"collapsedDataPatterns__\":\"[\\\"*\\\"]\"}","{\"note\":\"\\\"Map*\\\\n\\\\nThis rule must come after \\\\\\\"MapInfos\\\\\\\" and similar more specific rules.\\\"\",\"format\":\"true\",\"pathPattern_\":\"Map*.json\",\"collapsedDataPatterns__\":\"[\\\"bgm\\\",\\\"bgs\\\",\\\"encounterList.*\\\",\\\"data\\\",\\\"events.*.pages.*.list.*\\\",\\\"events.*.pages.*.moveRoute.list.*\\\",\\\"events.*.pages.*.image\\\"]\"}"]
 *
 * @param spaceCollapsed
 * @text Space collapsed?
 * @desc Adds spaces to collapsed values to make them easier to read and merge.
 * @type boolean
 * @default true
 *
 * @param noSpaceAfterColon
 * @text No space after colon?
 * @desc Removes the space after the colon separating keys and values in spaced collapsed values.
 * @type boolean
 * @default false
 * @parent spaceCollapsed
 *
 * @param wrapValueArraysAfter
 * @text Wrap value arrays after:
 * @desc After this many commas in a collapsed non-object array, insert a line break. 0 = OFF.
 * @type number
 * @min 0
 * @default 32
 *
 * @param spaceValueArraysAfter
 * @text Space value arrays after:
 * @desc After this many commas in a collapsed non-object array line, insert one/two additional space(s). 0 = OFF.
 * @type number
 * @min 0
 * @default 8
 * @parent wrapValueArraysAfter
 *
 * @help
 *
 * PLEASE MAKE A BACKUP BEFORE STARTING TO USE THIS PLUGIN!
 * (And please continue to make regular backups or backed-up Git commits, it's
 *  just a good idea in general.)
 *
 * I took care to make it as robust as possible, more so than the RPG Maker
 * Editor itself (which can erase part of your data if it crashes while saving)
 * but it still edits your data/ files.
 *
 * This plugin can intelligently, configurably format your project's data files
 * to make them easy to merge using Git or similar version control software.
 * This lets you more easily work together on a single project in parallel.
 *
 * Note that saving from the editor still saves compact JSON!
 * The JSON files in data/ are formatted at the start of each playtest.
 * As such, it's a good idea to playtest the project just before a Git commit.
 *
 * While the plugin uses rename-to-replace to update files atomically, please
 * still regularly make backup copies of your project!
 *
 * =====
 * Hints
 * =====
 *
 * To deploy your game with compact data files instead of human-readable ones,
 * save in the editor and then deploy without playtesting first.
 * You can still test the deployed version directly. This plugin remains
 * inactive outside of playtesting, even if it is still enabled.
 *
 * This plugin uses hard tabs (`'\t'`) as indentation. If the indentation
 * appears too wide, please change the tab width in the display settings of
 * your text editor.
 *
 * A summary with counts for formatted, unchanged and failed-to-be-formatted
 * files is emitted to the debug console at 'info' level whenever the
 * formatting routine runs.
 *
 * ===========
 * Limitations
 * ===========
 *
 * The file js/plugins.js also contains project data. However, formatting that
 * file is much more complex (if at all feasible) and as such out of scope for
 * this plugin.
 *
 * Files that contain the string `__TS_Pretty_JSON__` (without backticks) can't
 * be formatted. An error is logged to the debug console if formatting a file
 * fails for this or any other reason.
 *
 * The MapInfos.json file mostly contains editor state data like scroll
 * position and is therefore likely to conflict even if all meaningful changes
 * are elsewhere. I recommend not committing changes to this file into Git
 * *unless they are meaningful* (like rearranging or renaming maps).
 * The file is mostly left collapsed by default, but you can change this in the
 * plugin parameters by removing `*` from its collapsed data patterns if that
 * works better for you.
 *
 * =======
 * Caution
 * =======
 *
 * Do not use this plugin in a synchronised folder controlled by for example
 * OneDrive or Dropbox on Windows! The sporadic file locking caused by these
 * programs *will* make operation at best unreliable.
 *
 * Under Linux, this problem shouldn't occur due to the write-temp-and-replace
 * strategy this plugin uses to avoid overwriting project files with incomplete
 * data at any point in time.
 *
 * **Project file names must not end with `.__TS_Pretty_JSON__new`**, since
 * that extension is used for temporary files that are overwritten
 * without asking.
 *
 * ==========
 * Load Order
 * ==========
 *
 * Load this plugin *after* any other plugins that update JSON/data files.
 *
 * =================
 * Plugin Parameters
 * =================
 *
 * -----------------
 * Formatting Rules:
 * -----------------
 *
 * File rules that control which files inside `data/` are formatted (opt-in),
 * and which data in those files should be collapsed into one or relatively few
 * lines.
 *
 * See nested parameter descriptions for more information.
 *
 * ----------------     ---------------------
 * Space collapsed? and No space after colon?
 * ----------------     ---------------------
 *
 * These parameters control the formatting of collapsed values in general.
 *
 * Iff "Space collapsed?" is ON, spaces are inserted to improve readability.
 * Iff "No space after colon?" is also ON, then the spaces between property
 * keys and values are removed again to bind them more tightly. This may help
 * with some kinds of automated merging.
 *
 * ------------------------     -------------------------
 * Wrap value arrays after: and Space value arrays after:
 * ------------------------     -------------------------
 *
 * These parameters respectively control when to insert line breaks or extra
 * spaces after commas in directly collapsed arrays where all items are neither
 * strings nor nested objects nor arrays.
 *
 * Value spacing is determined separately for each line in the output, so if
 * "Wrap ..." was set to 7 and "Space ..." was set to 5, it would always be the
 * first 5 items in each line that are visually grouped together.
 *
 * The inserted space is larger when "No space after colon?" is OFF.
 * You can set either parameter to 0 to deactivate it entirely.
 *
 * ===============
 * Plugin Commands
 * ===============
 *
 * This plugin does not provide any plugin commands.
 *
 * ==============
 * JavaScript API
 * ==============
 *
 * This plugin does not provide a JavaScript API.
 *
 * ===================
 * Compatibility Notes
 * ===================
 *
 * This plugin was tested on RPG Maker MV 1.6.3 and RPG Maker MZ 1.7.0, uses
 * only the public Node.js API, and does not use any platform-specific APIs.
 *
 * This plugin should be compatible with any deployment target available for
 * RPG Maker MV and MZ, including web and most custom ones.
 *
 * If you notice issues or glitches in combination with other plugins, please
 * tell me about them, and I'll check if a compatibility tweak is feasible.
 *
 * =======
 * Support
 * =======
 *
 * Please don't hesitate to contact me with any issues you encounter (including
 * inconveniences) or if anything is unclear about the plugin!
 *
 * You can find up-to-date contact information at
 * https://itch.io/blog/480852/tamschis-support-contact-information-inquiries .
 *
 * =============
 * License Grant
 * =============
 *
 * A license for this plugin can be acquired at
 * https://tamschi.itch.io/pretty-json-for-rpg-maker .
 *
 * Once you have acquired it, you may redistribute and sublicense this plugin
 * file as part of games you create. You may not sublicense it separately or as
 * part of an asset- or resource-collection.
 *
 * You may modify this plugin when including it with your games, as long as the
 * attribution above and this license grant stay intact. If you do so, you must
 * add comments to indicate which changes you made from the original.
 *
 * Additionally, you may redistribute this file, both only free of charge and
 * only under this same license, as long as you at least equally present the
 * above link as the original download location as alternative to your copy of
 * this file and make that link freely available without any additional login
 * or membership requirement compared to viewing any advertisement of your copy
 * of this file.
 *
 * =========
 * Changelog
 * =========
 *
 * -------------
 * Version 1.0.2
 * -------------
 *
 * 2025-04-08
 *
 * Revisions:
 *
 * - Considerably sped up formatting with many collapsed parts!
 *
 *   If you have around 100 Commands in a Map's Events for example, this by
 *   default should result in a 10,000% speed-up while formatting that file.
 *
 *   (My original implementation was admitted very inefficient, scaling
 *   approximately with the square of the file size in some ways.)
 *
 * -------------
 * Version 1.0.1
 * -------------
 *
 * 2023-10-05
 *
 * Revisions:
 * - Map event pages' "image" values are now collapsed by default.
 *
 * -------------
 * Version 1.0.0
 * -------------
 *
 * 2023-10-04
 *
 * Initial release.
 */

/*~struct~FormattingRule:
 *
 * @param note
 * @text Note
 * @desc For your convenience. (Does nothing.)
 * @type note
 *
 * @param format
 * @text Format?
 * @desc Whether to process matched files at all.
 * @type boolean
 * @default true
 *
 * @param pathPattern_
 * @text Path Pattern
 * @desc Relative to `data/`. `*` matches any number of characters not `.` or `/`. Case-insensitive.
 * @type string
 *
 * @param collapsedDataPatterns__
 * @text Collapsed Data Patterns
 * @desc JS Paths. `*` matches any number of characters not `.`. Case-sensitive. The root node is never collapsed.
 * @type string[]
 * @default []
 */

'use strict';

try {

	// Too early to use `$gameTemp`.
	if (Utils.isOptionValid('test') && !Utils.isOptionValid('btest') && !Utils.isOptionValid('etest')) {
		const TS_PRETTY_JSON = 'TS_Pretty_JSON'; // DO NOT edit this to contain RegExp-special characters! You'll lose data if you do.
		const __TS_PRETTY_JSON__ = `__${TS_PRETTY_JSON}__`;

		const parameters = PluginManager.parameters(TS_PRETTY_JSON);
		decodeParameters(parameters);

		parameters.spaceCollapsed = !!parameters.spaceCollapsed;
		parameters.noSpaceAfterColon = !!parameters.noSpaceAfterColon;
		parameters.wrapValueArraysAfter = parameters.wrapValueArraysAfter || 0;
		parameters.spaceValueArraysAfter = parameters.spaceValueArraysAfter || 0;

		parameters.formattingRules = (parameters.formattingRules || []).map(r => {
			if (!r) return null;

			try {
				r.pathPattern = new RegExp(`^${[...(r.pathPattern || '')].map(c => {
					switch (c) {
						case '\\':
							return '/';

						case '^':
						case '$':
						case '+':
						case '?':
						case '.':
						case '(':
						case ')':
						case '|':
						case '[':
						case ']':
						case '{':
						case '}':
							return '\\' + c;

						case '*':
							return '[^./]*';

						default:
							return c;
					}
				}).join('')}$`, 'i');

				r.collapsedDataPatterns = (r.collapsedDataPatterns || []).map(p => {
					return new RegExp(`^${[...p].map(c => {
						switch (c) {
							case '/':
							case '\\':
							case '^':
							case '$':
							case '+':
							case '?':
							case '.':
							case '(':
							case ')':
							case '|':
							case '[':
							case ']':
							case '{':
							case '}':
								return '\\' + c;

							case '*':
								return '[^.]*';

							default:
								return c;
						}
					}).join('')}$`);
				}).filter(p => p);
			} catch (error) {
				console.error(`Couldn't compile file rule with note ${r.note}:`, error);
				return null;
			}

			return r;
		}).filter(r => r);

		const fs = require('fs');
		const path = require('path');

		const dirPath = 'data';

		let changedFileCounter = 0;
		let unchangedFileCounter = 0;
		let errorCounter = 0;
		for (let relPath of fs.readdirSync(dirPath).map(p => p.replace('\\', '/'))) {
			if (!/\.json$/i.test(relPath)) continue;

			try {
				const filePath = path.join(dirPath, relPath).replace('\\', '/');

				const stats = fs.lstatSync(filePath, { throwIfNoEntry: true });
				if (!stats.isFile()) continue;

				const rule = parameters.formattingRules.find(r => r.pathPattern.test(relPath));
				if (rule && rule.format) {
					const originalText = fs.readFileSync(filePath, { encoding: 'utf8' });
					const data = JSON.parse(originalText);

					if (JSON.stringify(data).includes(__TS_PRETTY_JSON__)) {
						throw new Error(`File contains ${JSON.stringify(__TS_PRETTY_JSON__)}.`);
					}

					/** @type {string[]} */
					const replacements = [];
					void function collapseParts(path, data, collapsedDataPatterns, replacements) {
						for (const key in data) {
							if (Object.hasOwnProperty.call(data, key)) {
								const keyPath = path ? `${path}.${key}` : key;
								if (collapsedDataPatterns.some(p => p.test(keyPath))) {
									const replacementKey = `${__TS_PRETTY_JSON__}${replacements.length}`;
									let replacement =
										parameters.spaceCollapsed ? JSON.stringify(data[key], undefined, '\n').replace(/\n+/g, ' ')
											: JSON.stringify(data[key]);

									if (parameters.spaceCollapsed && parameters.noSpaceAfterColon) {
										replacement = replacement.replace(/([^\\]":) /g, '$1');
									}

									if (data[key] instanceof Array && data[key].every(item => typeof item !== 'string' && (item === null || typeof item !== 'object'))) {
										// The first property is addressed without `.`!
										const depth = 1 + keyPath.replace(/[^.]/g, '').length / '.'.length;
										if (parameters.wrapValueArraysAfter > 0 && data[key].length > parameters.wrapValueArraysAfter) {
											replacement = replacement.replace(/^\[/, '[\n' + '\t'.repeat(depth + 1)).replace(/ *\]$/, `\n${'\t'.repeat(depth)}]`);
										}

										let lineCommas = 0;
										replacement = replacement.replace(/,/g, () => {
											lineCommas += 1;
											if (lineCommas % parameters.wrapValueArraysAfter === 0) {
												lineCommas = 0;
												return ',\n' + '\t'.repeat(depth + 1);
											} else if (lineCommas % parameters.spaceValueArraysAfter === 0) {
												return parameters.spaceCollapsed ? ',  ' : ', ';
											} else {
												return ',';
											}
										});

										replacement = replacement.replace(/^(\t*) */gm, '$1');
									}

									replacements.push(replacement);
									data[key] = replacementKey;
								} else if (typeof data[key] === 'object') {
									collapseParts(keyPath, data[key], collapsedDataPatterns, replacements);
								}
							}
						}
					}('', data, rule.collapsedDataPatterns, replacements);

					let formatted = JSON.stringify(data, undefined, '\t');
					formatted = formatted.replace(new RegExp(`"${__TS_PRETTY_JSON__}(\\d+)"`, 'g'), (match, p1) => replacements[p1]);

					if (formatted !== originalText) {
						changedFileCounter += 1;
						const tempPath = filePath + '.__TS_Pretty_JSON__new';
						fs.writeFileSync(tempPath, formatted, { encoding: 'utf8' });
						fs.renameSync(tempPath, filePath);
					} else {
						unchangedFileCounter += 1;
					}
				}
			} catch (error) {
				errorCounter += 1;
				console.error(`Couldn't format ${JSON.stringify(relPath)}:`, error);
			}
		}

		console.info("",
			changedFileCounter, changedFileCounter === 1 ? "data file formatted (modified).\n" : "data files formatted (modified).\n",
			unchangedFileCounter, unchangedFileCounter === 1 ? "data file was already formatted.\n" : "data files were already formatted.\n",
			errorCounter, errorCounter === 1 ? "error while formatting data files." : "errors while formatting data files."
		);
	}

	/**
	 * Recursively decodes plugin parameter value strings into more
	 * useful representations, according to their property name suffix.
	 *
	 * New suffixes may be added in the future, but you can safely add
	 * your own by prefixing the suffix name with your plugin name
	 * followed by `__`. Example: `'myParameter_TS_My_Plugin__customSuffix'`
	 *
	 * @param {Record<string, string | any>} parameterObject The parameters to decode in place.
	 */
	function decodeParameters(parameterObject) {
		if (typeof parameterObject !== "object" || parameterObject === null) {
			return;
		}

		for (const key of Object.getOwnPropertyNames(parameterObject)) {
			if (key.endsWith("__")) {
				if (parameterObject[key].trim() === "") {
					parameterObject[key.slice(0, -2)] = null;
				} else {
					const stringArray = JSON.parse(parameterObject[key]);
					parameterObject[key.slice(0, -2)] = stringArray;
					for (let i = 0; i < stringArray.length; i++) {
						stringArray[i] = stringArray[i].trim();
					}
				}
				delete parameterObject[key];
			} else if (key.endsWith("_")) {
				parameterObject[key.slice(0, -1)] = parameterObject[key].trim();
				delete parameterObject[key];
			} else if (typeof parameterObject[key] === 'string') {
				if (parameterObject[key].trim() === "") {
					parameterObject[key] = null;
				} else {
					parameterObject[key] = JSON.parse(parameterObject[key]);
					decodeParameters(parameterObject[key]);
				}
			}
		}
	}
} catch (error) {
	/**
	 * Raises `error` in a way that causes the game to display it.
	 * Errors thrown during plugin initialisation are normally discarded
	 * silently instead.
	 */
	void function raising() {
		if (!SceneManager._scene) {
			setTimeout(raising, 1000);
		} else {
			SceneManager.catchException(error);
		}
	}();
	throw error;
}
