window.onload = () => {

	let socket = io.connect("/");

	let durationAnimation = 0.4;
	let joystickAxis = {
		x: 0,
		y: 0,
	};

	let data = {
		username: "",
		roomid: "",
	};

	let home = document.querySelector(".home");
	let loginSection = document.querySelector(".login-container");
	let controllerSection = document.querySelector(".controller");

	let loginBtn = document.querySelector('#loginBtn');

	loginBtn.addEventListener("click", (e) => {
		openFullscreen();
		e.preventDefault();

		data.username = document.querySelector('#username').value;
		data.roomid = document.querySelector('#roomID').value.toUpperCase();

		socket.emit("client_new", data);
		socket.on("server_login_confirm", (data) => {

			let confirm = data.confirm;

			if (data.confirm) {
				// display controller

				document.body.classList.remove("state-login");
				document.body.classList.add("state-game");
				TweenMax.to(controllerSection, durationAnimation, {display: "block"});
				document.querySelectorAll(".userTextUI").forEach((e) => {
					TweenMax.to(e, 0,{color: data.color})
				});
				document.querySelectorAll(".userDivUI").forEach((e) => {
					TweenMax.to(e, 0,{backgroundColor: data.color})
				});

				// Event
				btn.addEventListener("touchmove", (e) => handleMove(e));
				document.querySelector(".fireBtn").addEventListener("click", function(){
					socket.emit("client_rocket");
					TweenMax.to(this, 0, {backgroundColor: "white"});
				});
				document.querySelector(".disconnect_btn").addEventListener("click", function(){
					window.location.reload();
				})

			} else {
				alert('Erreur de connexion');
			}
		});
	});


	let btn = document.querySelector(".joystick");

	let border = 10;

	let lastXPosition,
		lastYPosition;
	btn.addEventListener("touchstart", (e) => {
		lastXPosition = e.touches[0].clientX;
		lastYPosition = e.touches[0].clientY;
	});

	function handleMove(e) {

		let joystick = document.querySelector(".joystick__btn");

		joystick.style.display = "block";
		let currPosX = e.changedTouches[0].clientX;
		let currPosY = e.changedTouches[0].clientY;

		let middleX = btn.offsetLeft + btn.offsetWidth / 2;
		let middleY = btn.offsetTop + btn.offsetHeight / 2;

		joystickAxis.x = ((currPosX - middleX) / btn.offsetWidth ) * 2;
		joystickAxis.y = ((currPosY - middleY) / btn.offsetHeight ) * 2;

		joystickAxis.x = joystickAxis.x > 1 ? 1 : joystickAxis.x;
		joystickAxis.x = joystickAxis.x < -1 ? -1 : joystickAxis.x;

		joystickAxis.y = joystickAxis.y > 1 ? 1 : joystickAxis.y;
		joystickAxis.y = joystickAxis.y < -1 ? -1 : joystickAxis.y;

		joystick.style.left = middleX + joystickAxis.x * (btn.offsetWidth / 2) + "px";
		joystick.style.top = middleY + joystickAxis.y * (btn.offsetHeight / 2) + "px";

		socket.emit("client_move", joystickAxis);

		/*
		if(lastXPosition < currPosX){
			if(joystick.offsetLeft < btn.offsetLeft + btn.offsetWidth){
				joystick.style.left = joystick.offsetLeft + (currPosX - lastXPosition) + "px";
			}
		}else if(lastXPosition > currPosX){
			if(joystick.offsetLeft > btn.offsetLeft + border){
				joystick.style.left = joystick.offsetLeft + (currPosX - lastXPosition) + "px";
			}
		}

		if(lastYPosition < currPosY){
			if(joystick.offsetTop < btn.offsetTop + btn.offsetHeight){
				joystick.style.top = joystick.offsetTop + (currPosY - lastYPosition) + "px";
			}
		}else if(lastYPosition > currPosY){
			if(joystick.offsetTop > currPosY){
				joystick.style.top = joystick.offsetTop + (currPosY - lastYPosition) + "px";
			}
		}
		*/

		lastXPosition = currPosX;
		lastYPosition = currPosY;

		window.navigator.vibrate(200);
	}

	/* Get the documentElement (<html>) to display the page in fullscreen */
	var elem = document.documentElement;

	/* View in fullscreen */
	function openFullscreen() {
		if (elem.requestFullscreen) {
			elem.requestFullscreen();
		} else if (elem.mozRequestFullScreen) { /* Firefox */
			elem.mozRequestFullScreen();
		} else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
			elem.webkitRequestFullscreen();
		} else if (elem.msRequestFullscreen) { /* IE/Edge */
			elem.msRequestFullscreen();
		}
	}

	/* Close fullscreen */
	function closeFullscreen() {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.mozCancelFullScreen) { /* Firefox */
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
			document.webkitExitFullscreen();
		} else if (document.msExitFullscreen) { /* IE/Edge */
			document.msExitFullscreen();
		}
	}
}