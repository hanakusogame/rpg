//メッセージログウィンドウ表示用クラス
export class Log extends g.E {
	public setLog: (str: string) => void;
	constructor(scene: g.Scene, x: number, y: number) {
		super({ scene: scene, x: x, y: y });

		const font = new g.DynamicFont({
			game: g.game,
			fontFamily: g.FontFamily.Monospace,
			size: 15,
		});

		//背景
		const bg = new g.FilledRect({
			scene: scene,
			width: 250,
			height: 85,
			cssColor: "black",
			opacity: 0.5,
		});
		this.append(bg);

		//ログ表示用
		const logs: g.Label[] = [];
		const addLabel: (str: string) => void = (str) => {
			const label = new g.Label({
				scene: scene,
				font: font,
				textColor: "white",
				fontSize: 15,
				text: str,
				x:5
			});
			logs.push(label);
			this.append(label);
		};

		this.setLog = (str) => {
			if (logs.length < 5) {
				addLabel(str);
			} else {
				const label = logs.shift();
				label.text = str;
				label.invalidate();
				logs.push(label);
			}
			for (let i = 0; i < logs.length; i++) {
				logs[i].y = i * 16;
				logs[i].modified();
			}
		};
	}
}
