const pegs = {
	A: document.getElementById('pegA'),
	B: document.getElementById('pegB'),
	C: document.getElementById('pegC'),
};

const logsEl = document.getElementById('logs');
const diskCountSelect = document.getElementById('diskCount');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const progressBar = document.getElementById('progressBar');
const progressInfo = document.getElementById('progressInfo');
const speedInput = document.getElementById('speedInput');
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

let disks = [];
let moves = [];
let totalMoves = 0;
let currentMove = 0;
let running = false;
let paused = false;
let animationDelay = 250;

function createDisks(n) {
	Object.values(pegs).forEach((peg) => (peg.innerHTML = ''));
	disks = [];
	for (let i = n; i >= 1; i--) {
		const disk = document.createElement('div');
		disk.classList.add('disk');
		disk.style.width = `${30 + i * 18}px`;
		disk.style.background = `linear-gradient(90deg, hsl(${i * 40},80%,60%), hsl(${
			i * 40 + 30
		},80%,70%))`;
		disk.textContent = i;
		disks.push(disk);
		pegs.A.appendChild(disk);
	}
}

function hanoi(n, from, to, aux) {
	if (n === 0) return;
	hanoi(n - 1, from, aux, to);
	moves.push([from, to]);
	hanoi(n - 1, aux, to, from);
}

async function animateMove(from, to) {
	const disk = pegs[from].lastElementChild;
	if (!disk) return;

	const fromRect = pegs[from].getBoundingClientRect();
	const toRect = pegs[to].getBoundingClientRect();
	const diskRect = disk.getBoundingClientRect();

	const temp = disk.cloneNode(true);
	temp.classList.add('disk--animating');
	document.body.appendChild(temp);

	temp.style.position = 'absolute';
	temp.style.left = `${diskRect.left}px`;
	temp.style.top = `${diskRect.top}px`;

	pegs[from].removeChild(disk);

	const dx = toRect.left - fromRect.left;
	const duration = Math.max(100, animationDelay);
	const easing = 'cubic-bezier(0.45, 0.05, 0.55, 0.95)';

	await temp.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-140px)' }], {
		duration,
		easing,
		fill: 'forwards',
	}).finished;

	await temp.animate(
		[{ transform: 'translateY(-140px)' }, { transform: `translate(${dx}px, -140px)` }],
		{ duration, easing, fill: 'forwards' }
	).finished;

	await temp.animate(
		[{ transform: `translate(${dx}px, -140px)` }, { transform: `translate(${dx}px, 0)` }],
		{ duration, easing, fill: 'forwards' }
	).finished;

	document.body.removeChild(temp);
	pegs[to].appendChild(disk);
}

async function executeMoves() {
	running = true;
	paused = false;
	logsEl.classList.add('logs--active');

	while (currentMove < moves.length && running) {
		if (paused) {
			await new Promise((resolve) => setTimeout(resolve, 100));
			continue;
		}

		const [from, to] = moves[currentMove];
		await animateMove(from, to);
		logMove(from, to);
		currentMove++;
		updateProgress();
		await new Promise((resolve) => setTimeout(resolve, animationDelay));
	}
	running = false;
}

function logMove(from, to) {
	const pegMap = { A: '1', B: '2', C: '3' };
	const p = document.createElement('p');
	p.textContent = `${pegMap[from]} → ${pegMap[to]}`;
	logsEl.appendChild(p);
	logsEl.scrollTop = logsEl.scrollHeight;
}

function updateProgress() {
	const percent = ((currentMove / totalMoves) * 100).toFixed(1);
	progressBar.style.width = `${percent}%`;
	progressInfo.textContent = `Moves: ${currentMove} / ${totalMoves} | ${percent}%`;
}

function start() {
	if (!running) executeMoves();
	paused = false;
}

function pause() {
	paused = !paused;
	pauseBtn.textContent = paused ? 'Resume' : 'Pause';
}

function reset() {
	running = false;
	paused = false;
	currentMove = 0;
	moves = [];
	logsEl.innerHTML = '';
	logsEl.classList.remove('logs--active');

	const n = parseInt(diskCountSelect.value);
	createDisks(n);
	moves = [];
	hanoi(n, 'A', 'C', 'B');
	totalMoves = moves.length;
	updateProgress();
}

diskCountSelect.addEventListener('change', reset);
startBtn.addEventListener('click', start);
pauseBtn.addEventListener('click', pause);
resetBtn.addEventListener('click', reset);

speedInput.addEventListener('input', (e) => {
	const value = e.target.value;
	animationDelay = 400 - value * 3; // higher = faster
	if (animationDelay < 50) animationDelay = 50;
});

themeToggle.addEventListener('click', () => {
	body.classList.toggle('theme--dark');
	themeToggle.textContent = body.classList.contains('theme--dark') ? '☀️' : '🌙';
});

reset();
