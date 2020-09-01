import { MainScene } from "./MainScene";
import { Status } from "./Status";
import { Unit } from "./Unit";

declare function require(x: string): any;

// メインのゲーム画面
export class MainGame extends g.E {
	public reset: () => void;
	public finish: () => void;
	public setMode: (num: number) => void;

	constructor(scene: MainScene) {
		super({ scene: scene, x: 0, y: 0, width: 640, height: 360, touchable: true });

		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const tl = require("@akashic-extension/akashic-timeline");
		const timeline = new tl.Timeline(scene);

		//背景
		const bg = new g.FilledRect({
			scene: scene,
			width: g.game.width,
			height: g.game.height,
			cssColor: "white",
			opacity: 0.5,
		});
		this.append(bg);

		//建物等背景の親エンティティ
		const bgBase = new g.E({
			scene: scene,
		});
		this.append(bgBase);

		const font = new g.DynamicFont({
			game: g.game,
			fontFamily: g.FontFamily.Monospace,
			size: 24,
		});

		//マップ全体
		const base = new g.E({
			scene: scene,
		});
		this.append(base);

		//ステージ数表示用
		let stage = 1;
		const labelStage = new g.Label({
			scene: scene,
			font: font,
			fontSize: 24,
			textColor: "white",
			text: "エリア 0",
			x: 500,
			y: 270,
		});
		this.append(labelStage);

		//床
		const floor = new g.FilledRect({
			scene: scene,
			width: 640,
			height: 100,
			cssColor: "green",
			x: 0,
			y: 264,
		});
		base.append(floor);

		//プレイヤー
		const player = new Unit(scene, font, timeline);
		base.append(player);
		player.init(0, 1, floor.y);

		//ステータス表示
		const statusPlayer = new Status(scene, 10, 0, font);
		this.append(statusPlayer);

		//敵ステータス表示
		const statusEnemy = new Status(scene, 300, 0, font);
		this.append(statusEnemy);

		//ログ表示用
		const log = new Log(scene, 10, 270);
		this.append(log);

		//敵配置用
		const enemyBase = new g.E({
			scene: scene,
		});
		base.append(enemyBase);

		//敵
		for (let i = 0; i < 3; i++) {
			const enemy = new Unit(scene, font, timeline);
			enemyBase.append(enemy);
		}

		//城
		const castle = new g.Sprite({
			scene: scene,
			src: scene.assets.house,
			width: 250,
			height: 250,
			x: 0,
			y: floor.y - 250,
		});
		this.append(castle);

		//宿屋
		const inn = new g.Sprite({
			scene: scene,
			src: scene.assets.unit,
			width: 128,
			height: 128,
			srcY: 256,
			srcX: 128,
			x: 150,
			y: floor.y - 128,
		});
		bgBase.append(inn);

		//武器自販機
		const shop = new g.Sprite({
			scene: scene,
			src: scene.assets.shop,
			x: 300,
			y: floor.y - 250,
		});
		bgBase.append(shop);

		const priceLabels: g.Label[] = [];
		for (let i = 0; i < 3; i++) {
			//値段表示用
			const label = new g.Label({
				scene: scene,
				x: 20 + 80 * i,
				y: 110,
				font: font,
				fontSize: 20,
				textColor: "black",
				text: "1000",
			});
			shop.append(label);
			priceLabels.push(label);

			//自販機ボタン
			const btn = new g.FilledRect({
				scene: scene,
				width: 60,
				height: 60,
				x: 20 + 80 * i,
				y: 120,
				cssColor: "yellow",
				opacity:0.5,
				touchable: true,
			});
			shop.append(btn);
			btn.pointDown.add(() => {
				const enemy = enemyBase.children[i] as Unit;
				if (enemy.weapon.pram.price <= scene.score) {
					enemy.y = floor.y - enemy.height;
					enemy.modified();
					scene.addScore(-enemy.weapon.pram.price);
				}
			});
		}

		let loopCnt = 0;
		this.update.add(() => {
			if (!scene.isStart) return;
			if (moveX !== 0) {
				// プレイヤー移動
				player.x += (moveX < 0 ? -1 : 1) * player.getSpeed();
				player.modified();
			}

			let isIntersect = false;
			enemyBase.children?.forEach((enemy: Unit) => {
				if (enemy.visible() && enemy.hp > 0 && g.Collision.intersectAreas(player, enemy)) {
					if (loopCnt % (30 - player.attackTime) === 0) {
						//プレイヤーの攻撃
						const damage = player.attack(enemy);
						log.setLog(player.pram.name + "は" + enemy.pram.name + "に" + damage + "のダメージ");

						//敵を倒した時
						if (enemy.hp <= 0) {
							const isLevelUp = player.addExp(enemy);
							log.setLog("" + enemy.pram.name + "を倒した");
							log.setLog("経験値" + enemy.pram.presentExp + "を獲得");
							scene.addScore(enemy.pram.presentExp);
							if (isLevelUp) {
								log.setLog("レベルが" + player.pram.level + "に上がった");
							}
							enemy.die(true);
						}

						statusPlayer.setPrams(player);
						if (!isIntersect) statusEnemy.setPrams(enemy);
					} else if (loopCnt % (30 - enemy.attackTime) === 5) {
						//敵の攻撃
						const damage = enemy.attack(player);
						log.setLog(enemy.pram.name + "は" + player.pram.name + "に" + damage + "のダメージ");
						statusPlayer.setPrams(player);
						if (!isIntersect) statusEnemy.setPrams(enemy);
					}

					isIntersect = true;
				}
			});

			if (!isIntersect) {
				statusEnemy.hide();
			} else {
				statusEnemy.show();
			}

			//宿屋
			if (inn.visible() && g.Collision.intersectAreas(inn, player)) {
				if (loopCnt % 30 === 0) {
					player.addHp(10);
					statusPlayer.setPrams(player);
				}
			}

			//次のステージに移動
			if (player.x > g.game.width - player.width) {
				moveStage(stage + 1);
			}

			//前のステージに戻る
			if (player.x < 0 && stage !== 0) {
				moveStage(stage - 1);
			}

			loopCnt++;
		});

		let moveX = 0;
		this.pointDown.add((ev) => {
			moveX = ev.point.x - player.x - player.width / 2;
		});

		this.pointUp.add(() => {
			moveX = 0;
		});

		//武器を拾う
		player.pointDown.add(() => {
			for (let i = 0; i < enemyBase.children.length; i++) {
				const enemy = enemyBase.children[i] as Unit;
				if (!(enemy.state & 1) && g.Collision.intersectAreas(player, enemy) && enemy.hp <= 0) {
					log.setLog("" + enemy.weapon.pram.name + "を装備した");
					player.weapon.init(enemy.weapon.num);
					statusPlayer.setPrams(player);
					enemy.hide();
					break;
				}
			}
		});

		//ステージ移動
		const moveStage: (num: number) => void = (num) => {
			if (stage === 0) {
				castle.hide();
			} else if (stage % 4 === 0) {
				inn.hide();
				shop.hide();
			} else {
				enemyBase.children.forEach((enemy: Unit) => {
					enemy.hide();
				});
			}

			const p = stage <= num ? 1 : -1;
			stage = num;

			labelStage.text = "エリア " + stage;
			labelStage.invalidate();

			if (stage === 0 || stage % 4 === 0) {
				if (stage === 0) {
					//スタート地点(城のみ)
					castle.show();
				} else {
					//回復と自販機エリア
					inn.show();
					shop.show();
					enemyBase.children.forEach((enemy: Unit, i) => {
						enemy.x = 280 + 70 * i;
						enemy.init(1, 1, 130);
						enemy.show();
						enemy.angle = -45;
						enemy.modified();
						enemy.die(false); //殺す

						priceLabels[i].text = "" + enemy.weapon.pram.price;
						priceLabels[i].invalidate();
					});
				}
			} else {
				//敵エリア
				enemyBase.children.forEach((enemy: Unit) => {
					enemy.x = scene.random.get(100, 500);
					enemy.init(scene.random.get(1, 6), -p, floor.y);
					enemy.show();
					enemy.angle = 0;
					enemy.modified();
				});
			}

			player.x = p === -1 ? g.game.width - player.width : 0;
			player.modified();
			this.append(player);

			log.setLog("エリア " + stage);
		};

		// 終了
		this.finish = () => {
			return;
		};

		// リセット
		this.reset = () => {
			stage = -1;
			moveStage(0);
			statusPlayer.setPrams(player);
			inn.hide();
			shop.hide();
			return;
		};
	}
}

//ログ表示ウィンドウクラス
class Log extends g.E {
	public setLog: (str: string) => void;
	constructor(scene: g.Scene, x: number, y: number) {
		super({ scene: scene, x: x, y: y });

		const font = new g.DynamicFont({
			game: g.game,
			fontFamily: g.FontFamily.Monospace,
			size: 15,
		});

		//ログ表示用
		const logs: g.Label[] = [];
		const addLabel: (str: string) => void = (str) => {
			const label = new g.Label({
				scene: scene,
				font: font,
				textColor: "white",
				fontSize: 15,
				text: str,
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
