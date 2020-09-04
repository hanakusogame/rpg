//ステータス
type Pram = {
	id: number;
	name: string;
	atMin: number;
	atMax: number;
	dfMin: number;
	dfMax: number;
	sp: number;
	price: number;
};

let prams: Pram[] = null;

// 武器クラス
export class Weapon extends g.E {
	public init: (num: number) => void;
	public pram: Pram;
	public num: number;

	constructor(scene: g.Scene) {
		super({
			scene: scene,
			width: 30,
			height: 60,
			x: 50,
			y: 0,
		});

		if (!prams) {
			//csvを読み込んでパラメーター配列作成
			prams = [];
			const text = scene.assets.weapon_csv as g.TextAsset;

			// 読み込んだCSVデータが文字列として渡される
			//var result: string[][] = []; // 最終的な二次元配列を入れるための配列
			const tmp = text.data.split("\n"); // 改行を区切り文字として行を要素とした配列を生成

			// 各行ごとにカンマで区切った文字列を要素としたインスタンスを生成
			for (var i = 1; i < tmp.length; ++i) {
				const row = tmp[i].split(",");
				prams.push({
					id:Number(row[0]),
					name: row[1],
					atMin: Number(row[2]),
					atMax: Number(row[3]),
					dfMin: Number(row[4]),
					dfMax: Number(row[5]),
					sp: Number(row[6]),
					price: Number(row[7]),
				});
			}
		}

		console.log(prams);

		//画像表示用
		const spr = new g.FrameSprite({
			scene: scene,
			src: scene.assets.weapon as g.ImageAsset,
			width: 100,
			height: 100,
			frames: [0, 1, 2, 3, 4, 5, 6],
			y: -80,
		});
		this.append(spr);

		this.init = (num) => {
			this.num = num;
			this.pram = prams[num];
			spr.frameNumber = num;
			spr.modified();
		};
	}
}
