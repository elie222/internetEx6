function buttonPushed(button) {
	console.log('HERE');
	if (button === 'goToRegister') {
		document.getElementById("loginBox").style.display="none";
		document.getElementById("registerBox").style.display="inline";
	} else if (button === 'goToLogin') {
		document.getElementById("registerBox").style.display="none";
		document.getElementById("loginBox").style.display="inline";
	} else {
		console.log('not a button name');
	}
}