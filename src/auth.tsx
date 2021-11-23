import React, { Component } from "react";

import { Backend } from "@staticbackend/js";

declare global {
	var bkn: Backend;
}


export interface IProps {
	onToken: (token: string) => void;
}

interface IState {
	email: string;
	password: string;
}

export class Auth extends Component<IProps, IState> {
	constructor(props: any) {
		super(props);

		this.state = {
			email: "",
			password: ""
		}
	}

	handleChanges(field: string, e: TextEvent) {
		let state = this.state;
		state[field] = e.currentTarget?.value;
		this.setState(state);
	}

	handleLogin = async () => {
		const {email, password} = this.state;

		const res = await bkn.login(email, password);
		if (!res.ok) {
			alert(res.content);
			return;
		}

		this.props.onToken(res.content);
	}

	handleRegister = async () => {
		const {email, password} = this.state;

		const res = await bkn.register(email, password);
		if (!res.ok) {
			alert(res.content);
			return;
		}

		this.props.onToken(res.content);
	}

	render() {
		return (
			<div>
				<h1>Register or sign-in</h1>
				<p>
					<input 
						type="email" 
						value={this.state.email} 
						onChange={this.handleChanges.bind(this, "email")}>
						</input>
				</p>
				<p>
					<input 
						type="password" 
						value={this.state.password} 
						onChange={this.handleChanges.bind(this, "password")}>
						</input>
				</p>
				<p>
					<button onClick={this.handleRegister.bind(this)}>Register</button>
					<button onClick={this.handleLogin.bind(this)}>Login</button>
				</p>
			</div>
		)
	}
}