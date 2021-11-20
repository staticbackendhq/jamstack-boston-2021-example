import React, { Component } from "react";

import { Auth } from "./auth";
import { Bases } from "./bases";
import { TicTacToe } from "./tictactoe";

interface IState {
	token?: string;
	currentView: string;
}

export class App extends Component<any, IState> {
	constructor(props: any) {
		super(props);

		this.state = {
			token: null,
			currentView: "bases"
		}
	}

	authCompleted(token: string) {
		this.setState({ token: token });
	}

	handleMenuClick(menu: string) {
		this.setState({ currentView: menu });
	}

	renderApp() {
		let view = <Bases token={this.state.token} />;
		if (this.state.currentView == "tic") {
			view = <TicTacToe token={this.state.token} />;
		}
		return (
			<div>
				<div>
					<a onClick={this.handleMenuClick.bind(this, "bases")}>Bases</a>
					<a onClick={this.handleMenuClick.bind(this, "tic")}>Tic Tac Toe</a>
				</div>

				{view}

			</div>
		)
	}

	render() {
		let view = this.renderApp();
		if (!this.state.token) {
			view = <Auth onToken={this.authCompleted.bind(this)} />;
		}
		return view;
	}
}