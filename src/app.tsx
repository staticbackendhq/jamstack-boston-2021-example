import React, { Component } from "react";

import { Auth } from "./auth";
import { Bases } from "./bases";

interface IState {
	token?: string;
}

export class App extends Component<any, IState> {
	constructor(props: any) {
		super(props);

		this.state = {
			token: null
		}
	}

	authCompleted(token: string) {
		this.setState({ token: token });
	}

	render() {
		let view = <Bases token={this.state.token} />;
		if (!this.state.token) {
			view = <Auth onToken={this.authCompleted.bind(this)} />;
		}
		return view;
	}
}