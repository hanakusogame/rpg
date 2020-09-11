import tl = require("@akashic-extension/akashic-timeline");
import { Log } from "./Log";
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
		const timeline = new tl.Timeline(scene);

		//背景
		const bg = new g.Sprite({
			scene: scene,
			src: scene.assets.bg2,
			y: -80,
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
			width: g.game.width,
			height: g.game.height,
		});
		this.append(base);

		//ステータス・メッセージ等
		const uiBase = new g.E({
			scene: scene,
		});
		this.append(uiBase);

		const strokeFont = new g.DynamicFont({
			game: scene.game,
			fontFamily: g.FontFamily.Monospace,
			fontColor: "white",
			strokeColor: "black",
			strokeWidth: 7,
			size: 24,
		});

		//ステージ数表示用
		let stage = 1;
		const labelStage = new g.Label({
			scene: scene,
			font: strokeFont,
			fontSize: 24,
			text: "エリア 0",
			x: 510,
			y: 280,
		});
		uiBase.append(labelStage);

		//床
		const floor = new g.FilledRect({
			scene: scene,
			width: 640,
			height: 100,
			cssColor: "green",
			x: 0,
			y: 264,
		});
		//base.append(floor);

		//プレイヤー
		const player = new Unit(scene, font);
		base.append(player);
		player.init(0, 0, 1, floor.y);

		//ステータス表示
		const statusPlayer = new Status(scene, 5, 5, font);
		uiBase.append(statusPlayer);

		//敵ステータス表示
		const statusEnemy = new Status(scene, 300, 5, font);
		uiBase.append(statusEnemy);

		//ログ表示用
		const log = new Log(scene, 5, 270);
		this.append(log);

		//敵配置用
		const enemyBase = new g.E({
			scene: scene,
		});
		base.append(enemyBase);

		//敵
		for (let i = 0; i < 3; i++) {
			const enemy = new Unit(scene, font);
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
		bgBase.append(castle);

		//宿屋
		const innBack = new g.Sprite({
			scene: scene,
			src: scene.assets.inn_b,
			x: 50,
			y: floor.y - 210,
		});
		bgBase.append(innBack);

		const innFront = new g.Sprite({
			scene: scene,
			src: scene.assets.inn_f,
			x: 50,
			y: floor.y - 210,
		});
		this.append(innFront);

		//武器自販機
		const shop = new g.Sprite({
			scene: scene,
			src: scene.assets.shop,
			x: 300,
			y: floor.y - 270,
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
				opacity: 0.0,
				touchable: true,
			});
			shop.append(btn);
			btn.pointDown.add(() => {
				const enemy = enemyBase.children[i] as Unit;
				if (enemy.weapon.pram.price <= scene.score) {
					enemy.y = floor.y - enemy.height;
					enemy.modified();
					scene.addScore(-enemy.weapon.pram.price);
					scene.playSound("se_move");
				}
			});
		}

		const showDamage: (unit: Unit, damage: number) => void = (unit, damage) => {
			const str = damage < 0 ? "" : "+";
			const f = damage < 0 ? scene.numFontR : scene.numFont;
			const label = new g.Label({
				scene: scene,
				font: f,
				fontSize: 25,
				text: str + damage,
				x: unit.x + scene.random.get(0, 50) - unit.direction * 30,
				y: unit.y + 20,
			});
			this.parent.append(label);
			timeline
				.create(label)
				.moveBy(unit.direction * -20, -20, 200)
				.wait(1000)
				.call(() => {
					label.destroy();
				});
			if (damage < 0) {
				scene.playSound("se_attack");
			} else {
				scene.playSound("se_move");
			}
		};

		let loopCnt = 0;
		let allClearFlg = false;//ラスボス討伐フラグ
		const bossId = 33;//ラスボスのユニットID
		this.update.add(() => {
			if (!scene.isStart || player.hp <= 0) return;
			if (moveX !== 0) {
				// プレイヤー移動
				let distance = moveX < 0 ? -1 : 1;
				if (pointX < 100) distance = -1;
				if (pointX > base.width - 100) distance = 1;
				player.x += distance * player.getSpeed();
				player.modified();
			}

			let isIntersect = false;
			enemyBase.children?.forEach((enemy: Unit) => {
				if (!(enemy.visible() && enemy.hp > 0)) return;
				if (g.Collision.intersectAreas(player, enemy)) {
					if (loopCnt % (30 - player.weapon.pram.sp * 5) === 0) {
						//プレイヤーの攻撃
						const damage = player.attack(enemy);
						log.setLog(player.pram.name + "は" + enemy.pram.name + "に" + damage + "のダメージ");

						showDamage(enemy, -damage);

						//敵を倒した時
						if (enemy.hp <= 0) {
							const isLevelUp = player.addExp(enemy);
							log.setLog("" + enemy.pram.name + "を倒した");
							log.setLog("経験値" + enemy.pram.presentExp + "を獲得");
							scene.addScore(enemy.pram.score);
							if (isLevelUp) {
								log.setLog("レベルが" + player.pram.level + "に上がった");
							}
							enemy.die(true);
							scene.playSound("se_hit");

							//ラスボス討伐
							if (enemy.pram.id === bossId) {
								allClearFlg = true;
							}
						}

						statusPlayer.setPrams(player);
						if (!isIntersect) statusEnemy.setPrams(enemy);
					} else if (loopCnt % (30 - enemy.weapon.pram.sp * 5) === 4) {
						//敵の攻撃
						const damage = enemy.attack(player);
						log.setLog(enemy.pram.name + "は" + player.pram.name + "に" + damage + "のダメージ");
						statusPlayer.setPrams(player);
						if (!isIntersect) statusEnemy.setPrams(enemy);
						showDamage(player, -damage);
						//プレイヤー死亡
						if (player.hp <= 0) {
							player.die(true);
							log.setLog(player.pram.name + "は死んでしまった");
							scene.setTimeout(() => {
								start();
							}, 3000);
							scene.playSound("se_die");
						}
					}

					isIntersect = true;
				} else {
					enemy.x += 0.5 * enemy.direction;
					enemy.modified();

					if (enemy.direction === -1 && enemy.x < 0) enemy.direction = 1;
					else if (enemy.direction === 1 && enemy.x > base.width - enemy.base.width) enemy.direction = -1;
				}
			});

			if (!isIntersect) {
				statusEnemy.hide();
			} else {
				statusEnemy.show();
			}

			//回復ボックス
			if (innBack.visible() && g.Collision.intersectAreas(innBack, player)) {
				if (loopCnt % 30 === 0 && player.hp < player.pram.hpMax) {
					const num = (stage / 4) * 10;
					player.addHp(num);
					statusPlayer.setPrams(player);
					showDamage(player, num);
					log.setLog(player.pram.name + "はHPを" + num + "回復");
				}
			}

			//城
			if (castle.visible() && g.Collision.intersectAreas(castle, player)) {
				if (loopCnt % 30 === 0 && player.hp < player.pram.hpMax) {
					player.addHp(50);
					statusPlayer.setPrams(player);
					showDamage(player, 50);
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

		let pointX = 0;
		let moveX = 0;
		this.pointDown.add((ev) => {
			pointX = ev.point.x;
			moveX = pointX - player.x - player.width / 2;
		});

		this.pointUp.add(() => {
			pointX = 0;
			moveX = 0;
		});

		//武器を拾う
		player.pointDown.add(() => {
			for (let i = 0; i < enemyBase.children.length; i++) {
				const enemy = enemyBase.children[i] as Unit;
				if (!(enemy.state & 1) && g.Collision.intersectAreas(player, enemy) && enemy.hp <= 0) {
					if (enemy.weapon.num === 0) break;
					log.setLog("" + enemy.weapon.pram.name + "を装備した");
					player.weapon.init(enemy.weapon.num);
					statusPlayer.setPrams(player);
					enemy.hide();
					scene.playSound("se_item");
					break;
				}
			}
		});

		//ステージ移動
		const moveStage: (num: number) => void = (num) => {
			if (stage === 0) {
				castle.hide();
			} else if (stage % 4 === 0) {
				innBack.hide();
				innFront.hide();
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
					innBack.show();
					innFront.show();

					shop.show();
					enemyBase.children.forEach((enemy: Unit, i) => {
						enemy.x = 320 + 70 * i;
						const weaponNum = Math.min(scene.random.get(stage + 4, stage + 10), 24);
						enemy.init(1, weaponNum, 1, 80);
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
				enemyBase.children.forEach((enemy: Unit, i) => {
					enemy.x = scene.random.get(100, 180) + 170 * i;
					let unitNum = Math.min(scene.random.get(stage, stage + stage), 32);
					let weaponNum = Math.min(scene.random.get(stage, stage + 4), 24);
					if (stage % 4 === 3 && i === 2 && !allClearFlg) {
						unitNum = 30 + Math.min(Math.floor(stage / 4), 3); //ボス
						weaponNum = 0;
					}

					enemy.init(unitNum, weaponNum, -p, floor.y);
					enemy.show();
					enemy.angle = 0;
					enemy.modified();
				});
			}

			player.x = p === -1 ? g.game.width - player.width : 0;
			player.setDirection(p);
			player.modified();
			base.append(player);

			base.append(innFront);

			log.setLog("エリア " + stage);

			scene.playSound("se_miss");
		};

		// 終了
		this.finish = () => {
			return;
		};

		//スタート(プレイヤーが死んだ場合もここから)
		const start: () => void = () => {
			player.init(-1, 1, 1, floor.y);
			stage = -1; //変
			moveStage(0);
			statusPlayer.setPrams(player);
			innBack.hide();
			innFront.hide();
			shop.hide();
			return;
		};

		// リセット
		this.reset = () => {
			player.init(0, 0, 0, floor.y - player.base.height);
			allClearFlg = false;
			start();
		};
	}
}
