let md = markdownIt({
    html:     false,
    xhtmlOut: false,
    breaks:   true,
    linkify:  true,
    })
    .use(markdownItHtml5Media.html5Media, {
        videoAttrs: "preload=metadata",
        audioAttrs: "preload=metadata"
    });

Neutralino.init()
Neutralino.events.on("windowClose", Neutralino.app.exit)

let log = data => document.querySelector('#log-status').innerText = data;

(async () => {
    let process = await Neutralino.os.spawnProcess('./stockings run')
    Neutralino.events.on('spawnedProcess', (evt) => {
        if(process.id == evt.detail.id) {
            switch(evt.detail.action) {
                case 'stdOut':
                    log(evt.detail.data);
                    break;
                case 'stdErr':
                    error(evt.detail.data);
                    break;
                case 'exit':
                    log(`Daemon closed.`);
                    break;
            }
        }
    })
})();


let getArchives = async () => {
    let entries = await Neutralino.filesystem.readDirectory('./archives')
    let dirs = entries
               .filter(entry => entry.type == 'DIRECTORY')
               .map(entry => entry.entry)
               .filter(entry => entry != '.' && entry != '..')
    return dirs
}

let setAutocomplete = async () => {
    document.querySelector('#urls').innerHTML = 
    (await getArchives())
    .map(name => `<option>${name}/index.md</option>`)
    .join('\n')
}

let renderArchivesList = async () => {
    document.querySelector('#archives-list').innerHTML = 
    (await getArchives())
    .map(name => `<button onclick=openURL('${name}/index.md')>${name}</button>`)
    .join('<br>')
}

setAutocomplete()

let socksLoc = ""

window.onhashchange = () => {
    if(socksLoc != location.hash) {
        console.log('kek')
        openURL(location.hash.slice(1))
    }
}

let openURL = async path => {
    if(path.indexOf('mailto:') == 0) {
        location.href = path
    }
    path = decodeURI(path)
    if(path == '') {
        location.hash = ''
        location.reload()
        return
    }
    document.querySelector('#locbar').value = path
    location.hash = "#" + path
    socksLoc = "#" + path
    let data
    try {
        data = await Neutralino.filesystem.readFile(`./archives/${path}`)
    }
    catch(e) {
        document.querySelector('main').innerHTML = '<div class="error">ERROR: File not found.</div>'
        return false
    }
    document.querySelector('main').innerHTML = md.render(data)
    document.querySelectorAll('a').forEach(a => {
        if(a.href.indexOf('mailto:') == 0) {
            a.outerHTML = `<button onclick='location.href='${a.href}'>${a.innerHTML}</button>`
            return
        }
        a.outerHTML = `<button data-link='${decodeURI(a.pathname).slice(1)}' onclick='openURL("${decodeURI(a.pathname).slice(1)}")'>${a.innerHTML}</button>`
    })
    document.querySelectorAll('img, audio, video').forEach(async img => {
        let data 
        try {
            data = await Neutralino.filesystem.readBinaryFile(`./archives/${decodeURI(img.getAttribute('src'))}`)
        }
        catch(e) {
            img.outerHTML = "<div class='error inline'>ERROR: File not found.</div>"
        }
        let blob = new Blob([data], {type: 'image/*'})
        img.src = URL.createObjectURL(blob)
    })
    window.scrollTo(0, 0)
}

window.oncontextmenu = ev => ev.preventDefault()

new ContextMenu(':not(button)', [
    {
        name: 'Back',
        fn: () => history.back()
    },
    {
        name: 'Forward',
        fn: () => history.forward()
    },
    {
        name: 'Home',
        fn: () => openURL('')
    },
], {className: 'context'});
