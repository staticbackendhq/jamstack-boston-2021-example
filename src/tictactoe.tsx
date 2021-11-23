import React, { Component } from "react";

import { Backend } from "@staticbackend/js";
import { Payload } from "@staticbackend/js/dist/backend";

declare global {
	var bkn: Backend;
}


interface IRoom {
	id: string;
	name: string;
	waiting: boolean;
}

export interface IProps {
	token: string;
}

interface IState {
	me: string;
	rooms: Array<IRoom>;
	newRoom: string;
	currentRoom?: IRoom;
	waitingForJoin: boolean;
	roomOwner: boolean;
	myTurn: boolean;
	game: Array<string>;
	opponent: string;
}

export class TicTacToe extends Component<IProps, IState> {
	private repo: string = "rooms_774_";

	constructor(props: IProps) {
		super(props);

		let game = [" ", " ", " ", " ", " ", " ", " ", " ", " "];


		this.state = {
			me: "",
			rooms: [],
			newRoom: "",
			currentRoom: null,
			roomOwner: false,
			waitingForJoin: false,
			myTurn: false,
			game: game,
			opponent: ""
		}
	}

	componentDidMount = async () => {
		// get all rooms waiting for oppononet

		const filters = [
			["waiting", "==", true]
		];

		const res = await bkn.query(
			this.props.token,
			this.repo,
			filters);
		if (!res.ok) {
			alert(res.content);
			return;
		}

		this.setState({ rooms: res.content.results });
	}

	handleChanges(field: string, e: TextEvent) {
		let state = this.state;
		state[field] = e.currentTarget?.value;
		this.setState(state);
	}

	handleCreateRoom = async () => {
		this.setState({ roomOwner: true, waitingForJoin: false });

		let newRoom: IRoom = {
			name: this.state.newRoom,
			waiting: true
		}

		const res = await bkn.create(
			this.props.token,
			this.repo,
			newRoom)
		if (!res.ok) {
			alert(res.content);
			return;
		}

		this.handleJoin(res.content);
	}

	handleJoin(room: IRoom) {
		this.setState({ currentRoom: room });

		bkn.connect(
			this.props.token,
			this.onAuth.bind(this),
			this.onMessage.bind(this));
	}

	onAuth(token: string) {
		bkn.send(bkn.types.join, this.state.currentRoom.id);
	}

	onMessage(pl: Payload) {
		if (pl.type == bkn.types.joined) {
			// get other party name
			if (!this.state.roomOwner && !this.state.opponent) {
				const msg = { type: "name", value: this.state.me };
				bkn.send(bkn.types.chanIn, JSON.stringify(msg), this.state.currentRoom.id);
			}

			// if we're the owner, than an opponent joined
			// we can tag the room as not waiting anymore.
			if (this.state.roomOwner) {
				if (this.state.waitingForJoin) {
					this.setState({ waitingForJoin: false });
					this.tagRoom(this.state.currentRoom.id);
				} else {
					this.setState({ waitingForJoin: true });
				}
			}

			// pick who should start playing
			const isOwnerNext = new Date().getTime() % 2 == 0;

			const msg = { type: "player", owner: isOwnerNext };
			bkn.send(bkn.types.chanIn, JSON.stringify(msg), this.state.currentRoom.id);
		} else if (pl.type == bkn.types.chanOut) {
			try {
				const data = JSON.parse(pl.data);
				this.process(data);
			} catch (ex) {
				alert(ex);
			}
		}
	}

	process(data: any) {
		console.log(data);

		if (data.type == "name") {
			if (this.state.roomOwner && !this.state.waitingForJoin && !this.state.opponent) {
				const msg = { type: "name", value: this.state.me };
				bkn.send(bkn.types.chanIn, JSON.stringify(msg), this.state.currentRoom.id);

				this.setState({opponent: data.value});
			} else if (!this.state.roomOwner) {
				this.setState({opponent: data.value});
			}
		} else if (data.type == "player") {
			if (data.owner && this.state.roomOwner) {
				this.setState({ myTurn: true });
			} else if (!data.owner && !this.state.roomOwner) {
				this.setState({ myTurn: true });
			}
		} else if (data.type == "play") {
			let { game } = this.state;
			game[data.pos] = data.symbol;
			this.setState({ game: game });

			// set next player
			const msg = { type: "player", owner: !data.owner };
			bkn.send(bkn.types.chanIn, JSON.stringify(msg), this.state.currentRoom.id);
		}
	}

	tagRoom = async (id: string) => {
		const update = { waiting: false };
		const res = await bkn.update(
			this.props.token,
			this.repo,
			id,
			update);
		if (!res.ok) {
			alert(res.content);
			return;
		}
	}

	handleTurn(pos: number) {
		if (!this.state.myTurn) {
			alert("not your turn");
			return
		} else if (this.state.game[pos] != " ") {
			alert("cannot play there");
			return;
		}

		this.setState({ myTurn: false });

		const msg = {
			type: "play",
			pos: pos,
			symbol: this.state.roomOwner ? "x" : "o",
			owner: this.state.roomOwner
		};
		bkn.send(bkn.types.chanIn, JSON.stringify(msg), this.state.currentRoom.id);
	}

	renderLobby() {
		return (
			<div>
				<h1>Pick or create a room to play</h1>

				<h3>Enter your name</h3>
				<p>
					<input type="text" onChange={this.handleChanges.bind(this, "me")} value={this.state.me}></input>
				</p>

				<p>
					<input type="text" onChange={this.handleChanges.bind(this, "newRoom")} value={this.state.newRoom}></input>
				</p>

				<p>
					<button onClick={this.handleCreateRoom.bind(this)}>Create room</button>
				</p>

				<h3>Players waiting for a match</h3>

				{this.state.rooms.map((r) =>
					<p key={r.id}>
						<button onClick={this.handleJoin.bind(this, r)}>Join: {r.name}</button>
					</p>
				)}

			</div>
		)
	}

	renderGame() {
		let names = <h2>Wainting for opponent</h2>;
		if (this.state.opponent) {
			names = <h2>{this.state.me} vs. {this.state.opponent}</h2>;
		}
		return (
			<div>
				<h1>Room: {this.state.currentRoom?.name}</h1>
				{names}

				<h3>
					{this.state.myTurn ? "Your turn" : "Their turn"}
				</h3>

				<div>
					<div className="pos p0" onClick={this.handleTurn.bind(this, 0)}>{this.state.game[0]}</div>
					<div className="pos p1" onClick={this.handleTurn.bind(this, 1)}>{this.state.game[1]}</div>
					<div className="pos p2" onClick={this.handleTurn.bind(this, 2)}>{this.state.game[2]}</div>
				</div>
				<div>
					<div className="pos p3" onClick={this.handleTurn.bind(this, 3)}>{this.state.game[3]}</div>
					<div className="pos p4" onClick={this.handleTurn.bind(this, 4)}>{this.state.game[4]}</div>
					<div className="pos p5" onClick={this.handleTurn.bind(this, 5)}>{this.state.game[5]}</div>
				</div>
				<div>
					<div className="pos p6" onClick={this.handleTurn.bind(this, 6)}>{this.state.game[6]}</div>
					<div className="pos p7" onClick={this.handleTurn.bind(this, 7)}>{this.state.game[7]}</div>
					<div className="pos p8" onClick={this.handleTurn.bind(this, 8)}>{this.state.game[8]}</div>
				</div>
			</div>
		)
	}

	render() {
		if (this.state.currentRoom) {
			return this.renderGame();
		}
		return this.renderLobby();
	}
}