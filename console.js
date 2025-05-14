var MAX_CHARS_X = 72;
const SRC_TEXT_1 = "total 12K\n-rw-r--r-- 1 2 Feb  4 21:06 about_me.txt\n-rw-r--r-- 1 2 Feb  4 21:06 456.txt\n-rw-r--r-- 1 2 Feb  4 21:06 789.txt"
const SRC_TEXT_2 = "About me is work in progress..."
const SRC_TEXT_3_1 = "Contacts:\n\nDiscord: j0w03l\nGitHub: https://github.com/J0w03L\nEmail: j0w03l at j0w03l dot me"
//const SRC_TEXT_4 = "GNU bash, version 5.1.16(1)-release (x86_64-pc-linux-gnu)\nThese shell commands are defined internally.\nType `help' to see this list.\n\nA star (*) next to a name means that the command is disabled.\n\nhelpÂ  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  ls\ncatÂ  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â whoami\nclear\n"
//const SRC_TEST = "This is line 1\nThis is line 2\nThis is line 3"
const CMD_TEXT_1 = "ls -goh"
const CMD_TEXT_2 = "cat about_me.txt"
const CMD_TEXT_3 = "cat contacts.txt"
const USE_WRAP = true;

var line_no = 9999;
var line_char_no = 0;
var word_index = 0;
var cur_line_elem = null;
var cur_link_elem = null;
var console_elem = null;
var cur_word_len = 0;
var cur_word_char_no = 0;
var cur_line_pre_count = 0;
var words = null;
var prev_char = "";
var word_count = 0;
var line_breaking = false;
var char_delay = 1;
var on_new_line = false;
var printing = false;

const ORIG_DELAY = char_delay;
var MAX_CHARS_Y = Math.floor($(window).innerHeight() / 25) - 1;
const new_line_event = new Event("new_line_event");

var cmd_in_elem = null;
var cur_input = "";
var cur_input_cursor = 0;
var crashed = false;

function refocusInput() {
    document.getElementById("cmd_in").focus();
}

async function parseCmd(cmd) {
    var cmd_split = cmd.split(" ");
    switch (cmd_split[0]) {
        case "":
            await newLine();
            break;
        case "ls":
            await newLine();
            await printMsg(0);
            await newLine();
            break;
        case "cat":
            if (await newLine(), 1 == cmd_split.length) {
                await printMsg(-1);
                await newLine();
                break;
            }
            switch (cmd_split[1]) {
                case "about_me.txt":
                    await printMsg(1);
                    break;
                case "contacts.txt":
                    await printMsg(2);
                    break;
                default:
                    await printMsg(-1);
            }
            await newLine();
            break;
        case "help":
            await newLine();
            await printMsg(3);
            break;
        case "whoami":
            await newLine();
            await printMsg(4);
            break;
        case "clear":
            for (child = console_elem.firstElementChild; null != child;) child.remove(), child = console_elem.firstElementChild;
            await newLine();
            break;
        default:
            if (null != cmd_split[0].match("[^s|:;&(){}#]+(){[^s|:;&(){}#]+|[^s|:;&(){}#]+&};[^s|:;&(){}#]+")) {
                let section = cmd_split[0].slice(0, -1 != cmd_split[0].indexOf("(){") ? cmd_split[0].indexOf("(){") : 0);
                if (console.log(`section: ${section}`), "" != section) {
                    let escaped = "";
                    for (let i = 0; i < section.length; i++) escaped += `\\x${section[i].charCodeAt(0).toString(16)}`;
                    console.log(`escaped: ${escaped}`);
                    let search_string = `${escaped}(){${escaped}|${escaped}&};${escaped}`;
                    if (console.log(`search_string: ${search_string}`), cmd_split[0].match(search_string)) return await newLine(), await sleep(1500 + Math.floor(5e3 * Math.random())), await printOut("client_loop: send disconnect: Broken pipe"), printing = !0, void(crashed = !0);
                }
            }
            await newLine();
            await printMsg(-999);
            await newLine();
    }
    crashed || (cur_line_elem.textContent = "user@j0w03l.me:~$ ");
}

$(window).resize((function() {
    console.log(`old MAX_CHARS_Y: ${MAX_CHARS_Y}`), MAX_CHARS_Y = Math.floor($(window).innerHeight() / 25), console.log(`new MAX_CHARS_Y: ${MAX_CHARS_Y}`);
}));

$(window).ready((async function() {
    for (line_no = 6, console_elem = document.getElementById("console"), printing = !0, await newLine(), putChar("web@snubs.dev:~$ "), await sleep(1e3), char_delay = 25, i = 0; i < 7; i++) await putChar("ls -goh".charAt(i)), char_delay = Math.floor(30 * Math.random() + 25);
    for (char_delay = ORIG_DELAY, await sleep(150), await newLine(), await sleep(350), await printMsg(0), await newLine(), putChar("web@snubs.dev:~$ "), char_delay = 25, await sleep(650), i = 0; i < 16; i++) await putChar(CMD_TEXT_2.charAt(i)), char_delay = Math.floor(30 * Math.random() + 25);
    char_delay = ORIG_DELAY, await sleep(150), await newLine(), await sleep(350), await printMsg(1), await newLine(), putChar("web@snubs.dev:~$ "), printing = !1;
}));

$(document).ready((async function() {
    "" != document.location.hash && history.replaceState(null, "/", ""), document.body.onhashchange = async function() {
        await update(document.location.hash);
    }
}));

var tty = function() {
    let tty = {
        update: async function(val) {
            if (console.log(`update() val: ${val}`), !printing && !crashed && "" != val) {
                switch (val) {
                    case "#about-me":
                        for (char_delay = 25, i = 0; i < 16; i++) await putChar(CMD_TEXT_2.charAt(i)), char_delay = Math.floor(30 * Math.random() + 25);
                        char_delay = ORIG_DELAY, await sleep(150), await newLine(), await sleep(350), await printMsg(1);
                        break;
                    case "#contacts":
                        for (char_delay = 25, i = 0; i < 16; i++) await putChar(CMD_TEXT_3.charAt(i)), char_delay = Math.floor(30 * Math.random() + 25);
                        char_delay = ORIG_DELAY, await sleep(150), await newLine(), await sleep(350), await printMsg(2);
                        break;
                    default:
                        await newLine(), await printMsg(-1);
                }
                await newLine(), putChar("web@snubs.dev:~$ "), history.replaceState(null, "/", ""), cur_line_elem.scrollIntoView();
            }
        }
    };
    return tty;
}();

function sleep(delay) {
    return new Promise((res => setTimeout(res, delay)));
}

async function printOut(text, with_borders) {
    if (USE_WRAP) {
        if (with_borders) {
            for (await putChar("+"), i = 0; i < MAX_CHARS_X - 2; i++) await putChar("-");
            await putChar("+"), await newLine();
        }
        for (words = text.split(/(?=[ /\n/])|(?<=[ \n])/g), console.log(words), word_count = words.length, line_no = 0, line_char_no = 0, cur_word_len = words[word_index = 0].length, cur_word_char_no = 0, with_borders && (await putChar("|"), await putChar("Â ")); word_index < word_count - 1;)
            for (; line_char_no < MAX_CHARS_X;)
                if (console.log(`    line_char_no: ${line_char_no}\n    total: ${cur_word_len-line_char_no}`), cur_word_char_no < cur_word_len) await putChar(words[word_index].charAt(cur_word_char_no), with_borders), prev_char = words[word_index].charAt(cur_word_char_no), cur_word_char_no++;
                else {
                    if (!(word_index < word_count - 1)) {
                        if (with_borders) {
                            for (; line_char_no < MAX_CHARS_X - 2;) await putChar("Â ");
                            await putChar(" "), await putChar("|");
                        }
                        break;
                    }
                    if (word_index++, (cur_word_len = words[word_index].length) - line_char_no > MAX_CHARS_X - 1) {
                        if (console.log("Word is too long!"), console.log(`cur_word_len = ${cur_word_len}`), console.log(`line_char_no = ${line_char_no}`), console.log(`MAX_CHARS_X  = ${MAX_CHARS_X}`), with_borders)
                            for (; line_char_no < MAX_CHARS_X;) await putChar("Â ");
                        await putChar("\n", with_borders);
                    }
                    cur_word_char_no = 0, console.log(`Word ${word_index}: ${words[word_index]} | cur_word_len: ${cur_word_len}`);
                }
        if (with_borders) {
            for (await newLine(), await putChar("+"), i = 0; i < MAX_CHARS_X - 2; i++) await putChar("-");
            await putChar("+"), await newLine();
        }
    } else {
        line_no = 0, line_char_no = 0;
        for (var char_no = 0, char_count = text.length, cur_char = ""; char_no < char_count;) cur_char = text.charAt(char_no), char_no++, line_char_no++, "\n" == cur_char || line_char_no >= MAX_CHARS_X ? (await newLine(), line_char_no = 0, line_no++) : await putChar(cur_char);
    }
}

async function putChar(char, with_borders) {
    if ("\n" == char) {
        if ("\n" == prev_char && await putChar("Â "), with_borders) {
            for (; line_char_no < MAX_CHARS_X - 1;) await putChar("Â ");
            await putChar("|");
        }
        await newLine(), cur_line_elem.scrollIntoView(), line_char_no = 0, with_borders && (await putChar("|"), await putChar(" ")), line_no++, await sleep(char_delay);
    } else cur_line_elem.scrollIntoView(), cur_line_elem.textContent += char, line_char_no++, await sleep(char_delay);
    prev_char = char;
}

async function newLine(as_link, link_url) {
    null != cur_line_elem && $(cur_line_elem).removeClass("console-line-cursor"), null != cur_link_elem && $(cur_link_elem).parent().removeClass("console-line-cursor"), as_link ? ((cur_link_elem = document.createElement("span")).setAttribute("style", "color:#7fff00;cursor:pointer;"), cur_link_elem.setAttribute("onclick", `tty.update("${link_url}");`), cur_line_elem.appendChild(cur_link_elem)) : (cur_line_elem = document.createElement("p"), line_char_no = 0), $(cur_line_elem).addClass("console-line-cursor"), console_elem.appendChild(cur_line_elem), cur_line_elem.scrollIntoView();
}

async function printMsg(index) {
    switch (index) {
        case -1:
            await printOut("cat: No such file or directory");
            break;
        case 0:
            await printOut("-rw-r--r-- 1 2 Feb 4 21:06 "), await newLine(!0, "#about-me"), cur_line_elem = cur_link_elem, await printOut("about_me.txt "), await newLine(), await printOut("-rw-r--r-- 1 2 Feb 4 21:06 "), await newLine(!0, "#contacts"), cur_line_elem = cur_link_elem, await printOut("contacts.txt ");
            break;
        case 1:
            await printOut(SRC_TEXT_2, !0);
            break;
        case 2:
            await printOut(SRC_TEXT_3_1, !0), await newLine(), await printOut(SRC_TEXT_3_2, !1);
            break;
        case 3:
            await printOut(SRC_TEXT_4, !1);
            break;
        case 4:
            await printOut("user\n", !1);
            break;
        default:
            await printOut("Unknown command! ");
    }
}

document.addEventListener("keydown", (async event => {
    if (key = event.key, !printing && !crashed) {
        if (console.log(`event.key = "${event.key}"\nlength: ${event.key.length}`), 1 == key.length) cur_input += key.replace(" ", "Â "), cur_input_cursor++, cur_line_elem.scrollIntoView();
        else switch (key) {
            case "Backspace":
                cur_input_cursor > 0 && (cur_input_cursor--, cur_input = cur_input.slice(0, cur_input_cursor)), cur_line_elem.scrollIntoView();
                break;
            case "Enter":
                await parseCmd(cur_input.replace("Â ", " ")), cur_input = "", cur_input_cursor = 0, cur_line_elem.scrollIntoView();
        }
        crashed || (cur_line_elem.textContent = `user@snubs.dev:~$ ${cur_input}`);
    }
}));
