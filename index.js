let normalHeader = {
	status: 200,
	statusText: 'OK',
	headers: {
		'Content-Type': 'application/json;charset=utf-8',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET,POST,DELETE'
	}
};

let notFoundHeader = {
	status: 404,
	statusText: 'Not Found',
	headers: {
		'Content-Type': 'application/json;charset=utf-8',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET,POST,DELETE'
	}
};

let NotAvailableHeader = {
	status: 405,
	statusText: 'Not Found',
	headers: {
		'Content-Type': 'application/json;charset=utf-8',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET,POST,DELETE'
	}
};

export default {
	async fetch(request, env) {
		if (request.method === "OPTIONS") {
			// Make sure to customize these headers to fit your needs.
			return new Response(null, {
				headers: {
					"Access-Control-Allow-Origin": request.headers.get('Origin'), // Adjust this to be more restrictive if needed
					"Access-Control-Allow-Methods": "GET, POST, OPTIONS", // Include other methods your API needs
					"Access-Control-Allow-Headers": "Content-Type, Authorization", // Add other headers your API expects
				},
			})
		}

		normalHeader.headers["Access-Control-Allow-Origin"] = request.headers.get('Origin');
		NotAvailableHeader.headers["Access-Control-Allow-Origin"] = request.headers.get('Origin');
		notFoundHeader.headers["Access-Control-Allow-Origin"] = request.headers.get('Origin');
		const url = new URL(request.url);
		const path = url.pathname;

		if (path === "/signup") {
			return signup(request, env);
		} else if (path === "/login") {
			return login(request, env);
		} else if (path === "/signout") {
			return signout(request, env);
		} else if (path === "/getinfo") {
			return getinfo(request, env);
		} else if (path === "/avatar") {
			return avatar(request, env);
		} else if (path === "/history") {
			return history(request, env);
		} else {
			return new Response("Not Found", notFoundHeader);
		}
	}
}

async function signup(request, env) {
	if (request.method !== "POST") return new Response("Method Not Allowed", NotAvailableHeader);
	let { user, password } = await request.json();

	if (!user || !password) {
		return new Response(JSON.stringify({ "response": 'Missing user or password' }), NotAvailableHeader);
	}
	user = user.toLowerCase();

	// Check if the user already exists
	const existingUser = await env.chat.get(user);
	if (existingUser) {
		return new Response(JSON.stringify({ "response": 'User already exists' }), NotAvailableHeader);
	}

	// Store the new user data
	await env.chat.put(user, JSON.stringify({
		"password": password,
		"history": { "history": {}, "messages": {} },
		"avatar": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII",
		"authentication": [],
		"logincount": 0
	}));

	return new Response(JSON.stringify({ "response": 'User created successfully' }), normalHeader);
}

function getUser(request) {
	const url = new URL(request.url);
	const user = url.searchParams.get('user').toLowerCase();
	return user;
}

async function login(request, env) {
	if (request.method !== "GET") return new Response("Method Not Allowed", NotAvailableHeader);

	let user = getUser(request)
	let password = request.headers.get('Authorization');

	let userinfo = JSON.parse(await env.chat.get(user));
	if (userinfo) {
		if (userinfo.password === password) {
			let uuid = crypto.randomUUID();
			let toRe = {
				"history": userinfo.history,
				"avatar": userinfo.avatar,
				"logincount": userinfo.logincount
			};
			userinfo.authentication.push(uuid);
			userinfo.logincount += 1;
			await env.chat.put(user, JSON.stringify(userinfo));

			let toHeader = JSON.parse(JSON.stringify(normalHeader));
			toHeader["headers"]["Authorization"] = uuid;
			toHeader["headers"]["Access-Control-Expose-Headers"] = "Authorization";
			console.log(toHeader)
			return new Response(JSON.stringify(toRe), toHeader);
		} else {
			return new Response(JSON.stringify({ "response": 'Invalid user or password' }), notFoundHeader);
		}
	} else {
		return new Response(JSON.stringify({ "response": 'Account not found' }), notFoundHeader);
	}
}

async function getinfo(request, env) {
	if (request.method !== "GET") return new Response("Method Not Allowed", NotAvailableHeader);

	let user = getUser(request)
	const authentication = request.headers.get('Authorization');

	let userinfo = JSON.parse(await env.chat.get(user));
	// confirm it is alive
	if (userinfo.authentication.includes(authentication)) {
		let toRe = {
			"history": userinfo.history,
			"avatar": userinfo.avatar,
			"logincount": userinfo.logincount
		};

		return new Response(JSON.stringify(toRe), normalHeader);
	} else {
		return new Response(JSON.stringify({ "response": "Not Authenticate" }), NotAvailableHeader);
	}

}

function removeItemOnce(arr, value) {
	var index = arr.indexOf(value);
	if (index > -1) {
		arr.splice(index, 1);
	}
	return arr;
}

async function signout(request, env) {
	if (request.method !== "DELETE") return new Response("Method Not Allowed", NotAvailableHeader);
	let user = getUser(request)
	const authentication = request.headers.get('Authorization');

	let userinfo = JSON.parse(await env.chat.get(user));
	// confirm it is alive
	if (userinfo.authentication.includes(authentication)) {
		userinfo["authentication"] = removeItemOnce(userinfo["authentication"], authentication);
		await env.chat.put(user, JSON.stringify(userinfo));
		return new Response(JSON.stringify({ "response": "Logged out" }), normalHeader);
	} else {
		return new Response(JSON.stringify({ "response": "Already logged out" }), NotAvailableHeader);
	}
	return new Response("request");
}

// method for uploading avatar
async function avatar(request, env) {

	if (request.method === "POST") {
		let user = getUser(request)
		const authentication = request.headers.get('Authorization');
		const { avatar } = await request.json();

		let userinfo = JSON.parse(await env.chat.get(user));
		// confirm it is alive
		if (userinfo.authentication.includes(authentication)) {
			userinfo["avatar"] = avatar;
			await env.chat.put(user, JSON.stringify(userinfo));
			return new Response(JSON.stringify({ "response": "Updated" }), normalHeader);
		} else {
			return new Response(JSON.stringify({ "response": "Not Authenticate" }), NotAvailableHeader);
		}
		// update history
	} else if (request.method === "GET") {
		// get history from server
		let user = getUser(request)
		const authentication = request.headers.get('Authorization');

		let userinfo = JSON.parse(await env.chat.get(user));
		// confirm it is alive
		if (userinfo.authentication.includes(authentication)) {
			return new Response(JSON.stringify({ "response": userinfo.avatar }), normalHeader);
		} else {
			return new Response(JSON.stringify({ "response": "Not Authenticate" }), NotAvailableHeader);
		}

	}
	return new Response("Method Not Allowed", NotAvailableHeader);
}

// method for uploading avatar
async function history(request, env) {

	if (request.method === "POST") {
		let user = getUser(request)
		const authentication = request.headers.get('Authorization');
		const { history } = await request.json();

		let userinfo = JSON.parse(await env.chat.get(user));
		// confirm it is alive
		if (userinfo.authentication.includes(authentication)) {
			userinfo["history"] = history;
			await env.chat.put(user, JSON.stringify(userinfo));
			return new Response(JSON.stringify({ "response": "Updated" }), normalHeader);
		} else {
			return new Response(JSON.stringify({ "response": "Not Authenticate" }), NotAvailableHeader);
		}
		// update history
	} else if (request.method === "GET") {
		// get history from server
		let user = getUser(request)
		const authentication = request.headers.get('Authorization');

		let userinfo = JSON.parse(await env.chat.get(user));
		// confirm it is alive
		if (userinfo.authentication.includes(authentication)) {
			return new Response(JSON.stringify({ "response": userinfo.history }), normalHeader);
		} else {
			return new Response(JSON.stringify({ "response": "Not Authenticate" }), NotAvailableHeader);
		}

	}
	return new Response("Method Not Allowed", NotAvailableHeader);

}

