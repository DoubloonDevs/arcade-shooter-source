var orbital_snoops = false;

function check_orbital_snoops() {
	if (orbital_snoops) {
		player.speed = 500;
		dampening = 0.99;
	}	else {
		dampening = 0.875;
	}
}
setInterval(check_orbital_snoops, 0);