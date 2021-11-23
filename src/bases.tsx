import React, { Component } from "react";

import { Backend } from "@staticbackend/js";

declare global {
	var bkn: Backend;
}

interface ITable {
	id: string;
	accountId: string;
	name: string;
	displayFields: Array<string>;
	data: Array<any>;
}


export interface IProps {
	token: string;
}

interface IState {
	tables: Array<ITable>;
	newTable: string;
	newField: string;
	selectedId?: string;
}

export class Bases extends Component<IProps, IState> {
	constructor(props: IProps) {
		super(props);

		this.state = {
			tables: [],
			newTable: "",
			newField: "",
			selectedId: null
		}
	}

	componentDidMount = async () => {
		const res = await bkn.list(this.props.token, "tables");
		if (!res.ok) {
			alert(res.content);
			return;
		}

		if (res.content.total > 0) {
			this.setState({ tables: res.content.results });
		}
	}

	handleNewTableChanges(e: TextEvent) {
		this.setState({
			newTable: e.currentTarget?.value
		});
	}

	handleNewFieldChanges(e: TextEvent) {
		this.setState({
			newField: e.currentTarget?.value
		});
	}

	handleCreateTable = async () => {
		let table: ITable = {
			id: "",
			accountId: "",
			name: this.state.newTable,
			displayFields: [],
			data: []
		}

		const res = await bkn.create(this.props.token, "tables", table);
		if (!res.ok) {
			alert(res.content);
			return;
		}

		const { tables } = this.state;
		tables.push(res.content);
		this.setState({
			tables: tables,
			selectedId: res.id,
			newTable: ""
		});

	}

	handleAddField = async (id: string) => {
		const { tables, selectedId, newField } = this.state;
		let current = this.getCurrentTable(tables, selectedId);

		current.displayFields.push(newField);

		const res = await bkn.update(
			this.props.token,
			"tables",
			selectedId,
			{ displayFields: current.displayFields }
		);
		if (!res.ok) {
			alert(res.content);
			return;
		}

		// we update our state
		for (var i = 0; i < tables.length; i++) {
			if (tables[i].id == selectedId) {
				tables[i] = res.content;
				break;
			}
		}

		this.setState({ tables: tables, newField: "" });

		setTimeout(() => {
			this.ensureEditLine();
		}, 1000);
	}

	handleDeleteTable = async (id: string) => {
		const res = await bkn.delete(this.props.token, "tables", id)
		if (!res.ok) {
			alert(res.content);
			return;
		}

		const { tables } = this.state;

		let index = -1;
		for (var i = 0; i < tables.length; i++) {
			if (tables[i].id == id) {
				index = i;
				break;
			}
		}

		tables.splice(index, 1)
		this.setState({ tables: tables, selectedId: "" });
	}

	handleTableChange(id: string) {
		const { tables } = this.state;



		this.setState({ selectedId: id });

		setTimeout(() => {
			this.ensureEditLine();
		}, 1000);
	}

	ensureEditLine() {
		const { tables, selectedId } = this.state;

		for (var i = 0; i < tables.length; i++) {
			let current = tables[i];
			if (current.id != selectedId) {
				continue;
			}

			if (current.displayFields) {
				if (current.data && (current.data.length == 0 || current.data[current.data.length - 1].isNew == false)) {
					// we make sure we always have an empty line to edit
					let editLine = {};
					current.displayFields.map((f) => editLine[f] = "")
					editLine["id"] = new Date().getTime();
					editLine["isNew"] = true;

					current.data.push(editLine);

					tables[i] = current;
				}
			}
		}

		this.setState({ tables: tables });
	}

	handleDataChange = async (id: string, field: string, e: TextEvent) => {
		const { tables, selectedId } = this.state;
		let current = this.getCurrentTable(tables, selectedId);

		for (var i = 0; i < current.data.length; i++) {
			if (current.data[i].id == id) {
				current.data[i][field] = e.currentTarget?.value;
				break;
			}
		}

		for (var i = 0; i < tables.length; i++) {
			if (tables[i].id == selectedId) {
				tables[i] = current;
				break;
			}
		}

		this.setState({
			tables: tables
		});
	}

	handleDataValueChanged = async (id: string, field: string) => {
		const { tables, selectedId, dataValue } = this.state;
		const current = this.getCurrentTable(tables, selectedId);

		// get the data row updated
		let row = null;
		for (var i = 0; i < current.data.length; i++) {
			if (current.data[i].id == id) {
				current.data[i]["isNew"] = false;
				break;
			}
		}

		const res = await bkn.update(
			this.props.token,
			"tables",
			selectedId,
			{ data: current.data }
		);
		if (!res.ok) {
			alert(res.content);
			return;
		}

		// we update our state
		for (var i = 0; i < tables.length; i++) {
			if (tables[i].id == selectedId) {
				tables[i] = res.content;
				break;
			}
		}

		this.setState({ tables: tables });

		setTimeout(() => {
			this.ensureEditLine();
		}, 1000);
	}

	renderMenu() {
		const { tables } = this.state;

		const existingTables = tables.map((t) =>
			<a key={t.id} href="#" onClick={this.handleTableChange.bind(this, t.id)}>
				{t.name}
			</a>
		);

		return (
			<p id="menu">
				{existingTables}
				<input value={this.state.newTable} onChange={this.handleNewTableChanges.bind(this)} />
				<button onClick={this.handleCreateTable.bind(this)}>Create new table</button>
			</p>
		)
	}

	renderCurrentTable() {
		const { tables, selectedId } = this.state;

		const current = this.getCurrentTable(tables, selectedId);
		if (!current) {
			return;
		}

		const tableHeaders = current.displayFields.map((f) =>
			<th key={f}>{f}</th>
		)

		const tableData = current.data.map((d) =>
			<tr key={d.id}>
				{current.displayFields.map((f) =>
					<td key={d.id + "_" + f}>
						<input
							value={d[f]}
							onChange={this.handleDataChange.bind(this, d.id, f)}
							onBlur={this.handleDataValueChanged.bind(this, d.id, f)}
						/>
					</td>
				)}
			</tr>
		);

		return (
			<div>
				<div id="toolbar">
					<h2>{current.name}</h2>
					<input value={this.state.newField} onChange={this.handleNewFieldChanges.bind(this)} />
					<button onClick={this.handleAddField.bind(this, current.id)}>Add field</button>
					<button onClick={this.handleDeleteTable.bind(this, current.id)}>Delete table</button>
				</div>
				<table>
					<thead>
						<tr>
							{tableHeaders}
						</tr>
					</thead>
					<tbody>
						{tableData}
					</tbody>
				</table>
			</div >
		)
	}

	render() {
		const menu = this.renderMenu();
		const currentTable = this.renderCurrentTable();

		return (
			<div>
				<h1>WaterTable - demo of StaticBackend</h1>
				{menu}
				{currentTable}

			</div>
		)
	}

	getCurrentTable(tables: Array<ITable>, id: string): ITable {
		const res = tables.filter((t) => t.id == id);
		if (res && res.length == 1) {
			return res[0];
		}
		return null;
	}
}