This plugin can intelligently, configurably format your project's data files to make them easy to merge using Git or similar version control software.

This lets you more easily work together on a single project in parallel.

Note that saving from the editor still saves compact JSON!

The JSON files in data/ are formatted at the start of each playtest. As such, it's a good idea to playtest the project just before a Git commit.

While the plugin uses rename-to-replace to update files atomically, please still regularly make backup copies of your project!

Before deploying for Linux on Windows, you must update MV's NW.js runtime.

Hints
To deploy your game with compact data files instead of human-readable ones, save in the editor and then deploy without playtesting first.
You can still test the deployed version directly. This plugin remains inactive outside of playtesting, even if it is still enabled.

This plugin uses hard tabs ('\t') as indentation. If the indentation appears too wide, please change the tab width in the display settings of your text editor.

A summary with counts for formatted, unchanged and failed-to-be-formatted files is emitted to the debug console at 'info' level whenever the  formatting routine runs.

Limitations
The file js/plugins.js also contains project data. However, formatting that file is much more complex (if at all feasible) and as such out of scope for this plugin.
Files that contain the string __TS_Pretty_JSON__ can't be formatted.
An error is logged to the debug console if formatting a file fails for this or any other reason.
The MapInfos.json file mostly contains editor state data like scroll position and is therefore likely to conflict even if all meaningful changes are elsewhere.
I recommend not committing changes to this file into Git unless they are meaningful (like rearranging or renaming maps).
The file is mostly left collapsed by default, but you can change this in the plugin parameters by removing * from its collapsed data patterns if that works better for you.
Caution
Do not use this plugin in a synchronised folder controlled by for example OneDrive or Dropbox on Windows! The sporadic file locking caused by these programs *will* make operation at best unreliable.

Under Linux, this problem shouldn't occur due to the write-temp-and-replace strategy this plugin uses to avoid overwriting project files with incomplete data at any point in time.

Project file names must not end with .__TS_Pretty_JSON__new, since that extension is used for temporary files that are overwritten without asking.

Load Order
Load this plugin after any other plugins that update JSON/data files.

Plugin Parameters
Formatting Rules:

File rules that control which files inside data/ are formatted (opt-in), and which data in those files should be collapsed into one or relatively few lines.

This parameter's default should work for most RPG Maker MV and MZ projects.

See nested parameter descriptions for more information.

Space collapsed? and No space after colon?

These parameters control the formatting of collapsed values in general.

Iff "Space collapsed?" is ON, spaces are inserted to improve readability.

Iff "No space after colon?" is also ON, then the spaces between property keys and values are removed again to bind them more tightly. This may help with some kinds of automated merging.

Wrap value arrays after: and Space value arrays after:

These parameters respectively control when to insert line breaks or extra spaces after commas in directly collapsed arrays where all items are neither strings nor nested objects nor arrays.

Value spacing is determined separately for each line in the output, so if "Wrap ..." was set to 7 and "Space ..." was set to 5, it would always be the first 5 items in each line that are visually grouped together.

The inserted space is larger when "No space after colon?" is OFF.

You can set either parameter to 0 to deactivate it entirely.

Plugin Commands
This plugin does not provide any plugin commands.

JavaScript API
This plugin does not provide a JavaScript API.

Compatibility Notes
This plugin was tested on RPG Maker MV 1.6.3 and RPG Maker MZ 1.7.0, uses only the public Node.js API, and does not use any platform-specific APIs.

This plugin should be compatible with any deployment target available for RPG Maker MV and MZ, including web and most custom ones.

If you notice issues or glitches in combination with other plugins, please tell me about them, and I'll check if a compatibility tweak is feasible.

Copy of License Grant
(as included in the plugin file, aside from line wrapping)

A license for this plugin can be acquired at https://tamschi.itch.io/pretty-json-for-rpg-maker .

Once you have acquired it, you may redistribute and sublicense this plugin file as part of games you create. You may not sublicense it separately or as part of an asset- or resource-collection.

You may modify this plugin when including it with your games, as long as the attribution above and this license grant stay intact. If you do so, you must add comments to indicate which changes you made from the original.

Additionally, you may redistribute this file, both only free of charge and only under this same license, as long as you at least equally present the above link as the original download location as alternative to your copy of this file and make that link freely available without any additional login or membership requirement compared to viewing any advertisement of your copy of this file.