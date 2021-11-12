var db = {
	
	providers : [
	    {key: "A24" , name: "Frutteto Casagrande Srl", reflow_id: "01FM039GCRF2SFC49YTE9BMJQM"},
	    {key: "D226", name: "G.A.L.A. Fruit Srl", reflow_id: "01FKQSCDT94AWWBVTYS22DJ1V0"},
	    {key: "A105", name: "Scotti F.lli, Società Agricola S.S.", reflow_id: "01FKQVD1NMGMY9C3CC7M7MKBTY"},
	],

	users : [
	    {name: "RECUP", tg_id: "", reflow_id: "01FKNV3D8T0CBC8SYASJASRSS6", role: "admin"},
	    {name: "vcuculo", tg_id: 15705654, reflow_id: "", role: "admin"},
	    {name: "Croce Rossa Italiana", tg_id: "", reflow_id: "01FKQVX0JNWE9QNX437SKTPSTM", role: "user"}
	],

	groups : [
	    {name: "RECUP", tg_id: -795134012},
	    {name: "Donations", tg_id: -682075892},
	],

	units : [
		{label: "colli", reflow_id: "01FKNWF5Q3013GYDC4A9CCY65R"},
		{label: "kg", reflow_id: "01FKNWFJ1J8S41FFACXQ8A05B0"}
	],

	categories : [
		{label: "sorted", reflow_id: "01FM1ZAK95ACZSQJBAD0NXKV4E"}
	],

	getGroupFromName: function (name) {
		return this.groups.filter(g => g.name === name);
	},

	getUserFromTGid: function (tg_id) {
		return this.users.filter(u => u.tg_id === tg_id);
	},

	getUserFromRFid: function (r_id) {
		return this.users.filter(u => u.reflow_id === r_id);
	},

	getUserByName: function (name) {
    	return this.users.filter(u => u.name === name);
	},

	getRECUP: function () {
		return this.users.filter(u => u.name === "RECUP");
	},

	getCRI: function () {
		return this.users.filter(u => u.name === "Croce Rossa Italiana");
	},

	getTagFromLabel: function (label) {
		return this.categories.filter(c => c.label === label);
	},

	getProviderByName: function (name) {
    	return this.providers.filter(u => u.name === name);
	},

	getProviderByKey: function (key) {
		return this.providers.filter(p => p.key === key);
	},

	getProviderByRFid: function (r_id) {
		return this.providers.filter(p => p.reflow_id === r_id);
	},

	getUnitByLabel: function (label) {
		return this.units.filter(u => u.label === label);	
	},

	isAdminFromTGid: function (tg_id) {
		return this.getUserFromTGid(tg_id)[0].role == 'admin';
	}
}

module.exports = db
