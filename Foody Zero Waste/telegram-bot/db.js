var db = {
	
	providers : [
	    {key: "A24" , name: "Frutteto Casagrande Srl", reflow_id: "01FVAF4GD9FEHY2FBQZF3XJZDQ"},
	    {key: "D226", name: "G.A.L.A. Fruit Srl", reflow_id: "01FVAF5EWQP6P2XFVRDKBMQ9TT"},
	    {key: "A105", name: "Ortofrutticola Milanese", reflow_id: "01FVAF6A77TNFW3CJQAMRQXNSQ"},
	    {key: "B00",  name: "Babaco Market", reflow_id: "01FVAF6VS1F4N1QVHV8YPKJMGC"}
	],

	users : [
	    {name: "RECUP", tg_id: [759539227, 2041891763, 5000284368, 2010827287, 15705654], reflow_id: "01FVAF3EZCV3AQCN9NH3SFPB3X", role: "admin"},
	    {name: "opendot", tg_id: [15705654], reflow_id: "", role: "admin"},
	    {name: "Croce Rossa Italiana - Opera", tg_id: [1070872101, 423049777], reflow_id: "01FVAF7GTQ2NDPH6Y6G9GMHNKW", role: "receiver"},
	    {name: "Croce Rossa Italiana - San Donato", tg_id: [1736566518, 57139726], reflow_id: "01FVAF8CHBR51S02GH1JD27QC0", role: "receiver"}    
	],

	groups : [
	    {name: "IN", tg_id: -795134012},
	    {name: "OUT", tg_id: -682075892},
	],

	units : [
		{label: "colli", reflow_id: "01FVAFF05F0CEC526J8ZK0YBDC"},
		{label: "kg", reflow_id: "01FVAFFCQ6YG9VPZHE8G14GSD1"}
	],

	categories : [
		{label: "sorted", reflow_id: "01FVAFGMBTFE83P73BVKYMRTXP"}
	],

	stickers : [
		{label: "ok", file_id: "CAACAgIAAxkBAAEDxK9h9B01rQ2PfTgxqBgT8r3OPKUyigACJhMAAmgHOEt0ijxy_lBiOyME"}
	],

	getSticker: function (name) {
		return this.stickers.filter(s => s.label == name);
	},

	getGroupFromName: function (name) {
		return this.groups.filter(g => g.name === name);
	},

	getUserFromTGid: function (tg_id) {
		return this.users.filter(u => u.tg_id.includes(tg_id));
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

	getReceivers: function () {
		return this.users.filter(u => u.role === 'receiver');	
	},

	isReceiverFromTGid: function (tg_id) {
		let u = this.getUserFromTGid(tg_id);
		console.log(u)
		if (u.length > 0){
			for (i in u)
				console.log(u[i])
				if (u[i].role == 'receiver')
					return true
			return false
		} else
			return false		
	},

	isAdminFromTGid: function (tg_id) {
		let u = this.getUserFromTGid(tg_id);
		if (u.length > 0)
			return u[0].role == 'admin';
		else
			return false
	}
}

module.exports = db
