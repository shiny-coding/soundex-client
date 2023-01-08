import { localStorageUsernameId } from "./shared";

let $username = document.querySelector( 'input[name="username"]' ) as HTMLInputElement;
let $password = document.querySelector( 'input[name="password"]' ) as HTMLInputElement;

let username = localStorage.getItem( localStorageUsernameId ) ?? '';

$username.value = username;

let $submit = document.querySelector( 'input[type="submit"]' ) as HTMLElement;
let $status = document.querySelector( '#status' ) as HTMLElement;

function sendLoginMessage() {
	let username = $username.value;
	let password = $password.value;
	let message = { username, password };

	console.log( 'sending message' );
	console.log( message );

	chrome.tabs && chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		chrome.tabs.sendMessage( tabs[0].id || 0, message, ( response ) => {
			console.log( 'got a response' );

			$status.textContent = response;
		} );
	});
}

$username.addEventListener( 'input', function() {
	localStorage.setItem( localStorageUsernameId, this.value );
} );

$submit.addEventListener( 'click', function() {
	console.log( 'clicked submit' );
	sendLoginMessage();
} );
