Reveal.initialize({
    hash: true,
    controls: true,
    progress: true,
    transition: "convex"
});
const layer = document.getElementById("circuit-layer");

function createHorizontal() {

    const width = 300 + Math.random() * 700;
    const x = Math.random() * (window.innerWidth - width);
    const y = Math.random() * window.innerHeight;

    const line = document.createElement("div");

    line.className = "circuit-line horizontal";

    line.style.width = width + "px";
    line.style.left = x + "px";
    line.style.top = y + "px";

    layer.appendChild(line);

    const signal = document.createElement("div");

    signal.className = "signal";

    signal.style.left = x + "px";
    signal.style.top = (y - 3) + "px";

    layer.appendChild(signal);

    let pos = 0;

    setInterval(() => {

        pos += 2;

        if(pos > width)
            pos = 0;

        signal.style.left = (x + pos) + "px";

    }, 16);
}

function createVertical() {

    const height = 300 + Math.random() * 500;
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * (window.innerHeight - height);

    const line = document.createElement("div");

    line.className = "circuit-line vertical";

    line.style.height = height + "px";
    line.style.left = x + "px";
    line.style.top = y + "px";

    layer.appendChild(line);

    const signal = document.createElement("div");

    signal.className = "signal";

    signal.style.left = (x - 3) + "px";
    signal.style.top = y + "px";

    layer.appendChild(signal);

    let pos = 0;

    setInterval(() => {

        pos += 2;

        if(pos > height)
            pos = 0;

        signal.style.top = (y + pos) + "px";

    }, 16);
}

for(let i=0;i<12;i++)
    createHorizontal();

for(let i=0;i<10;i++)
createVertical();
for(let i=0;i<25;i++){

    const node=document.createElement("div");

    node.className="node";

    node.style.left=
        Math.random()*window.innerWidth+"px";

    node.style.top=
        Math.random()*window.innerHeight+"px";

    layer.appendChild(node);
}
Reveal.on('slidechanged', () => {

    document.body.classList.add("flash");

    setTimeout(() => {

        document.body.classList.remove("flash");

    },500);

});
Reveal.on('slidechanged', () => {

    const wave =
        document.createElement("div");

    wave.className =
        "energy-wave";

    document.body.appendChild(wave);

    setTimeout(() => {

        wave.remove();

    },1000);

});