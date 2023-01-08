import md5 from "md5";
import $ from "jquery";
import Account from "./model";
import { localStorageUsernameId, localStoragePasswordHashId } from "./shared";

const soundexServerHost = 'https://soundex.herokuapp.com';

var usedPrevButton = false;

var account : Account = {
	username : localStorage.getItem( localStorageUsernameId ) ?? '',
	passwordHash : localStorage.getItem( localStoragePasswordHashId) ?? '',
	tracks : []
}

var loggedIn = false;
var detailedLogging = false;
var useLocalStorage = false;

if ( account.username ) {
	loginOrRegister( account.username, account.passwordHash );
}

function calculatePasswordHash( password:string ) : string {
	return md5( password );
}

async function loginOrRegisterLocal( account : Account ) : Promise<Account> {
	let tracksJson = localStorage.getItem( 'hidden-tracks' );
	let tracks = JSON.parse( tracksJson ?? '[]' );
	return { ...account, tracks };
}

async function updateLocal( account : Account ) {
	localStorage.setItem( 'hidden-tracks', JSON.stringify( account.tracks ) );
	detailedLogging && console.log( localStorage.getItem( 'hidden-tracks' ) );
}

async function loginOrRegisterImpl( account : Account ) : Promise<any> {
	if ( useLocalStorage ) {
		return loginOrRegisterLocal( account );
	} else {
		return requestSoundex( 'login_or_register', account );
	}
}

async function update( account : Account ) : Promise<any> {
	if ( useLocalStorage ) {
		return updateLocal( account );
	} else {
		return requestSoundex( 'update', account );
	}
}

async function requestSoundex( action : string, account : Account ) : Promise<any> {
	const data = new URLSearchParams();
	data.set( 'username', account.username );
	data.set( 'passwordHash', account.passwordHash );
	data.set( 'tracks', JSON.stringify( account.tracks ) );

	let url = `${soundexServerHost}/${action}`;
	console.log( 'doing a soundex request: ' + url );
	const response = await fetch( url, {
		method: 'POST', // *GET, POST, PUT, DELETE, etc.
		mode: 'cors', // no-cors, *cors, same-origin
		headers: {
			//   'Content-Type': 'application/json'
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
		body: data // body data type must match "Content-Type" header
	} );

	console.log( 'response from soundex' );
	console.log( response );

	return await response.json();
}

function onElementInserted( containerSelector : string, elementSelector : string, callback:
	(element: Node) => void ) {

    var onMutationsObserved = function(mutations:MutationRecord[]) {
        for ( let mutation of mutations ) {
            if (mutation.addedNodes.length) {
                var elements = $(mutation.addedNodes).find(elementSelector);
                for (var i = 0, len = elements.length; i < len; i++) {
                    callback( elements[i] );
                }
            }
        }
    };

    var target = $(containerSelector)[0];
    var config = { childList: true, subtree: true };
    var MutationObserver = window.MutationObserver;// || window.WebKitMutationObserver;
    var observer = new MutationObserver(onMutationsObserved);
    observer.observe(target, config);
}

function navigate( forward:boolean, currentHref:string ) {
	detailedLogging && console.log( 'navigating ' + (forward ? 'forward' : 'backward') );
	$( forward ? '.playControls__next' : '.playControls__prev' ).trigger( 'click' );
}

$(document).ready(function() {
	$( '.playControls__prev' ).on( 'click', function() {
		usedPrevButton = true;
		detailedLogging && console.log( 'usedPrevButton = true;' );
	} );
	$( '.playControls__next' ).on( 'click', function() {
		usedPrevButton = false;
		detailedLogging && console.log( 'usedPrevButton = false;' );
	} );
} );

onElementInserted('body', '.playbackSoundBadge__titleLink', function(element:Node) {

	if ( !loggedIn ) return;

	setTimeout( async function() {
		let href = $( element ).attr( 'href' ) ?? '';

		let _usedPrevButton = usedPrevButton;
		usedPrevButton = false;
		detailedLogging && console.log( 'usedPrevButton = false;' );
		if ( account.tracks.includes( href ) ) {
			detailedLogging && console.log( 'skipping ' + href );
			navigate( !_usedPrevButton, href );
		}
	} );
} );

async function waitLogInSoundex() {
	while ( true ) {
		if ( loggedIn ) return Promise.resolve();
		await new Promise( resolve => setTimeout(resolve, 1000) );
	}
}

onElementInserted('body', '.sc-button-copylink, .compactTrackListItem__plays', async function(element:Node) {

	await waitLogInSoundex();

	if ( !element.isConnected ) {
		console.log( 'ignoring detached element' );
		return;
	}

	let $element = $( element );
	let href = getHref( $element );

	if ( loggedIn && account.tracks.includes( href ) ) {
		hide( element );
	}
	if ( !$element.next().is( '.sc-button-hide' ) ) {
		let $button = $( `<button type="button" class="sc-button-hide sc-button-secondary sc-button sc-button-small sc-button-responsive" aria-describedby="tooltip-566" tabindex="0" title="Hide" aria-label="Hide">Hide</button>` );
		if ( $element.is( '.compactTrackListItem__plays' ) ) {
			$button.css( 'margin-left', '0.5rem' );
		}
		$( element ).after( $button );
	}
});

function hide( element:Node | JQuery<Node> ) {
	$( element ).closest( '.soundList__item, .compactTrackList__item, .systemPlaylistTrackList__item' )
		.addClass( 'hidden-by-soundex' ).hide();
}

function getHref( element:JQuery<Node> ) : string {
	let $element = $( element );
	let $container = $element.closest( '.sound__content, .compactTrackList__item, .systemPlaylistTrackList__item' );
	let href : string | undefined;
	if ( $container.is( '.sound__content' ) ) {
		href = $container.find( 'a.soundTitle__title' ).attr( 'href' );
	} else if ( $container.is( '.compactTrackList__item' ) ) {
		href = $container.find( '.compactTrackListItem__trackTitle' ).attr( 'data-permalink-path' );
	} else {
		href = $container.find( 'a.sc-link-primary' ).attr( 'href' );
	}
	if ( !href ) {
		console.log( 'cannot get href from element ' );
		console.log( $element );
		throw "cannot get href from element";
	}

	return href;
}

$( 'body' ).on( 'click', '.sc-button-hide', async function() {

	if ( !loggedIn ) {
		alert( 'Login or register first' );
		return;
	}
	let $element = $( this );
	let href = getHref( $element );
	if ( !account.tracks.includes( href ) ) {
		account.tracks.push( href );
	}

	hide( $element[ 0 ] );
	update( account );
} );

async function loginOrRegister( username : string, passwordHash : string ) {

	loggedIn = false;

	console.log( 'loginOrRegister' );
	localStorage.setItem( 'soundex-username', username );
	localStorage.setItem( 'soundex-passwordHash', passwordHash );

	try {
		let result = await loginOrRegisterImpl( { username, passwordHash, tracks : [] } );
		if ( result.result ) {
			account = result.account;
			account.passwordHash = passwordHash;
			loggedIn = true;
		} else {
			console.log( result.error );
			loggedIn = false;
		}
	} catch ( e ) {
		console.log( 'failed to login or register' );
		loggedIn = false;
	}
}

chrome.runtime.onMessage.addListener( async ( message, sender, sendResponse ) => {

	loginOrRegister( message.username as string, calculatePasswordHash( message.password ) );
	sendResponse( 'success' );
} );
