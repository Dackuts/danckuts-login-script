import * as readline from "node:readline";
import { Console, Effect } from "effect";

const readLine = (prompt: string) =>
	Effect.async<string, never, never>((resume) => {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});

		rl.question(`${prompt}: `, (answer) => {
			rl.close();
			resume(Effect.succeed(answer));
		});
	});

const exit = await Effect.runPromiseExit(
	Effect.gen(function* () {
		const phoneNumber = yield* readLine("Enter phone number");
		yield* Effect.tryPromise({
			try: () =>
				fetch("https://atlas.danckuts.com/api/auth/send-text-code", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ phoneNumber }),
				}).then((res) => res.json()),
			catch: (error) => {
				console.error(error);
				return Effect.fail("Failed to send text code");
			},
		});
		const code = yield* readLine("Enter code");
		const response = yield* Effect.tryPromise({
			try: () =>
				fetch("https://atlas.danckuts.com/api/auth/check-text-code", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ code, phoneNumber }),
				}).then((res) => res.json() as Promise<{ payload: { token: string } }>),
			catch: (error) => {
				console.error(error);
				return Effect.fail("Failed to authenticate");
			},
		});
		const token = response?.payload?.token;
		if (token == null) {
			return Effect.fail("Failed to authenticate");
		}
		const userData = yield* Effect.tryPromise({
			try: () =>
				fetch("https://atlas.danckuts.com/api/auth/me", {
					headers: {
						"Content-Type": "application/json",
						authorization: `Bearer ${token}`,
					},
				}).then((res) => res.json()),
			catch: (error) => {
				console.error(error);
				return Effect.fail("Failed to fetch user data");
			},
		});
		yield* Console.info("User Data:");
		yield* Console.log(userData);
	}),
);
if (exit._tag !== "Success") {
	console.error(exit);
}
