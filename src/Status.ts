import { Unit } from "./Unit";
//ステータスクラス
export class Status extends g.E {
	public setPrams: (unit: Unit) => void;

	constructor(scene: g.Scene, x: number, y: number, font: g.Font) {
		super({ scene: scene, x: x, y: y });

		const createLabel: (x: number, y: number, text: string) => g.Label = (x, y, text) => {
			return new g.Label({
				scene: scene,
				font: font,
				fontSize: 15,
				text: text,
				textColor: "white",
				x: x,
				y: y,
			});
		};

		//ラベルを作成して配置
		const createPram: (x: number, y: number, text: string) => g.Label = (x, y, text) => {
			const labelTitle = createLabel(x * 130, y * 16, text);
			this.append(labelTitle);

			const label = createLabel(50, 0, "0");
			labelTitle.append(label);

			return label;
		};

		const labelName = createPram(0, 0, "名前");
		const labelLevel = createPram(0, 1, "LV");
		const labelHp = createPram(0, 2, "HP");
		const labelAt = createPram(0, 3, "攻撃");
		const labelDf = createPram(0, 4, "防御");
		const labelSp = createPram(0, 5, "素早さ");
		const labelExp = createPram(1, 0, "経験値");
		const labelWeapon = createPram(1, 1, "武器");
		const labelWeaponAt = createPram(1, 2, "攻撃");
		const labelWeaponDf = createPram(1, 3, "防御");
		const labelWeaponSp = createPram(1, 4, "素早さ");

		//ラベルに数値を表示
		const setPramNum: (label: g.Label, num: number) => void = (label, num) => {
			setPramStr(label, "" + num);
		};

		//ラベルに数値を表示
		const setPramStr: (label: g.Label, str: string) => void = (label, str) => {
			label.text = str;
			label.invalidate();
		};

		//全てのステータス変更
		this.setPrams = (unit) => {
			//キャラクター自身のパラメータ
			setPramStr(labelName, unit.pram.name);
			setPramNum(labelLevel, unit.pram.level);
			setPramStr(labelHp, "" + unit.hp + "/" + unit.pram.hpMax);
			setPramNum(labelAt, unit.pram.at);
			setPramNum(labelDf, unit.pram.df);
			setPramNum(labelSp, unit.pram.sp);
			setPramNum(labelExp, unit.pram.exp);

			//武器のパラメータ
			const wPram = unit.weapon.pram;
			setPramStr(labelWeapon, wPram.name);
			setPramStr(labelWeaponAt, "" + wPram.atMin + "〜" + wPram.atMax);
			setPramStr(labelWeaponDf, "" + wPram.dfMin + "〜" + wPram.dfMax);
			setPramNum(labelWeaponSp, wPram.sp);
		};
	}
}
